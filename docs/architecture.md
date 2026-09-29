# StructShield — System Architecture

## 1. Overview
StructShield is a high-throughput, event-driven detection platform designed to detect suspicious UPI transaction structuring patterns (smurfing/split payments). In UPI person-to-merchant (P2M) ecosystems, individuals or colluding actors may break down a large payment into multiple sub-₹2,000 transactions within a narrow timeframe to circumvent limits, tax reporting, or automated velocity triggers.

StructShield adopts a **CQRS-lite event-driven architecture** that decouples the write/ingestion hot path from the query/compliance management read path.

---

## 2. Architectural Diagram

```
                 SYNTHETIC / UPI TRANSACTION SOURCE
                                |
                                v
                       +----------------+
                       |  Spring Boot   |
                       | Ingestion API  |
                       +-------+--------+
                               |
                               v
                       +----------------+
                       |  Apache Kafka  |
                       | 'transactions' |
                       +-------+--------+
                               |
                               v
                       +----------------+
                       |  Spring Boot   |
                       | Detection Svc  |
                       +-------+--------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
        +--------------+               +---------------+
        | Redis 7.x    |               | PostgreSQL 16 |
        | Sorted Sets  |               | Persistent    |
        | Rolling Win  |               | Audit Store   |
        +--------------+               +-------+-------+
                                               |
                                               v
                                        Spring Boot API
                                               |
                                               v
                                        React Dashboard
                                               |
                                               v
                                       Compliance Analyst

Detection Service
       |
       | (Risk Score >= 70)
       v
Kafka 'flags' topic
       |
       v
Notification Worker
       |
       +---> Audit Logs / Webhook Dispatch
```

---

## 3. Component Breakdown

### 3.1 Ingestion API (Write Side)
- **Controller**: `TransactionController` exposes `POST /api/transactions`.
- **Validation**: Strict schema validation using Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Positive`, `@Pattern`).
- **Producer**: `TransactionProducer` delivers `TransactionEvent` asynchronously to the Kafka topic `transactions` keyed by `merchantId:payerId` to preserve partition ordering for specific actor pairs.
- **Latency Target**: Ingestion endpoint acknowledges within `< 15ms` without blocking on database locks or complex detection algorithms.

### 3.2 Messaging Backbone (Apache Kafka)
- **Topic `transactions`**: High-throughput topic storing raw validated transaction events with a 24-hour log retention.
- **Topic `flags`**: Emitted whenever a candidate cluster crosses the configurable risk score threshold (`RISK_THRESHOLD=70`).
- **Partitioning Strategy**: Partitioned by hash of `merchantId:payerId`, guaranteeing that all events for a given merchant-payer pair arrive at the same Kafka partition in strict chronological order.

### 3.3 Rolling Window Store (Redis Sorted Sets)
- **Key Pattern**: `window:{merchantId}:{payerId}`
- **Data Structure**: Redis Sorted Set (`ZSET`).
- **Score**: Millisecond epoch timestamp of the transaction (`occurredAt.toEpochMilli()`).
- **Value**: Serialized lightweight transaction event payload (transaction ID, amount, timestamp, device hash).
- **Eviction & Expiration**: 
  - Proactive sliding window: Transactions older than `now - 5 minutes` are trimmed using `ZREMRANGEBYSCORE`.
  - Passive TTL: Key TTL is set to 10 minutes (`EXPIRE window:{...} 600`), ensuring abandoned sessions expire automatically with zero memory leaks.

### 3.4 Structuring Detector & Risk Score Engine
- **Filtering**: Ignores individual transactions above ₹2,000 (standard UPI soft cap).
- **Evaluation**: Triggers when $\ge 3$ eligible transactions exist in the rolling 5-minute window for the identical merchant + payer pair.
- **Scoring**: Computes five explainable signals up to a maximum cap of 100 points:
  1. Cluster Size (+8 pts per transaction, capped at 30).
  2. Time Spacing (< 30s avg $\to$ +25 pts; < 120s avg $\to$ +15 pts).
  3. Near ₹2,000 Ceiling ($\ge$ ₹1,800 ratio $\times$ 20 pts).
  4. Round Total Target (+15 pts if combined sum is a multiple of ₹500).
  5. Device Consistency (+10 pts if all events share identical device hash).

### 3.5 Persistent Storage (PostgreSQL)
- Serves as the authoritative source of truth for persistent clusters, transactions, merchant risk profiles, and analyst review history.
- Relational schema with foreign keys, composite indexes on `(merchant_id, payer_id, occurred_at)`, and explicit `NUMERIC(12,2)` types for all currency fields to prevent floating-point inaccuracies.

### 3.6 Read Side & Compliance Dashboard (React + Spring Boot REST)
- Secure REST endpoints (`/api/flags`, `/api/dashboard/summary`, `/api/merchants/{id}/risk`).
- Analysts can inspect the cluster timeline, evaluate the mathematical signal breakdown, and submit decisions (`REVIEWED` or `DISMISSED`) accompanied by audit notes.

---

## 4. Architectural Decisions & Trade-Offs

| Decision | Alternative Considered | Rationale |
| :--- | :--- | :--- |
| **Kafka + Redis over PostgreSQL polling** | Direct DB queries / Scheduled cron | Polling PostgreSQL for rolling time windows creates massive write contention and table lock amplification under high TPS. Redis ZSET provides $O(\log N + M)$ sliding window queries in sub-millisecond memory operations. |
| **CQRS-Lite over Full Event Sourcing** | Axon Framework / Event Store | Full Event Sourcing introduces high operational complexity (event schema migrations, projection replay overhead). CQRS-lite gives asynchronous ingest separation with straightforward relational queries for analysts. |
| **KRaft mode Kafka** | ZooKeeper-based Kafka | Eliminates ZooKeeper operational overhead, provides faster metadata propagation, and simplifies local and containerized deployments. |
| **BigDecimal for monetary values** | Double / Float | Floating-point arithmetic produces precision loss (e.g., $0.1 + 0.2 = 0.30000000000000004$). In financial compliance systems, exact decimal precision is non-negotiable. |

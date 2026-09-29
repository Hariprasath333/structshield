# StructShield — System Design & Engineering Interview Notes

This document contains in-depth rationale for architectural and implementation choices in StructShield, structured for engineering discussions and technical interviews.

---

### 1. Why Apache Kafka?
- **Decoupling Ingestion from Heavy Processing**: Payment gateways and UPI switches must acknowledge payment transactions in under 20ms. Ingestion cannot block on sliding window lookups, risk calculations, or database transactions. Kafka acts as a durable, distributed shock absorber.
- **Partition Ordering**: By partitioning the `transactions` topic on `merchantId:payerId`, all events for a specific merchant-payer pair arrive on the same partition, guaranteeing chronological processing without complex distributed locks.
- **Replayability & Audit**: If detection logic is updated or a downstream database experiences transient failure, events can be reprocessed from any offset.

### 2. Why Redis Sorted Sets (ZSET) for Rolling Windows?
- **Time-Complexity**:
  - Adding a transaction: $O(\log N)$
  - Querying transactions within $[now - 5\text{ min}, now]$: $O(\log N + M)$
  - Removing expired transactions: $O(\log N + M)$
- **Low Memory Overhead**: Only lightweight transaction identifiers and timestamps are retained in memory.
- **Passive Key Expiration**: Redis TTLs on keys (`EXPIRE window:... 600`) automatically prune abandoned sessions without requiring a background garbage collector thread in Java.

### 3. Why PostgreSQL?
- **ACID Transactions**: Persisting a cluster and its many-to-many transaction associations (`cluster_transaction`) requires strict atomicity.
- **Relational Integrity**: Foreign keys ensure transactions cannot reference non-existent merchants or payers.
- **Complex Querying**: Compliance analysts filter clusters by risk score, date ranges, status, and merchant risk aggregates—queries readily accelerated by composite B-tree indexes.

### 4. Why BigDecimal for Financial Money Values?
- **Avoid Precision Loss**: Binary floating-point types (`float` and `double`) represent numbers in IEEE 754 format, which cannot accurately represent decimal fractions like `0.1` or `0.05`. In a fraud detection engine where sums are checked against round numbers (e.g., ₹5,000) or ceiling thresholds (₹2,000.00), floating-point inaccuracies would lead to incorrect classifications and false positives/negatives.

### 5. Why Explainable Risk Scoring over Black-Box ML for v1?
- **Regulatory Compliance**: Financial regulators (RBI, FATF, FINCEN) require explainability in Suspicious Transaction Reports (STRs). An analyst cannot escalate an alert with "The neural network scored 0.89"; they need concrete reasons (e.g., "+25 for <30s payment gap, +20 for near-threshold amounts").
- **Cold Start & Ground Truth Absence**: Production UPI structuring labels are not publicly available. Rule-based scoring establishes a reliable baseline and generates verified reviewer outcomes (`REVIEWED` vs `DISMISSED`) which can later serve as training labels for ML models.

### 6. What Happens if Redis Fails?
- Redis is an in-memory window cache, not the permanent audit store.
- **Graceful Failure**: If Redis is unavailable, the detector catches the connection exception and logs a critical alert. Crucially, the consumer does NOT silently drop transactions (which would cause false negatives); it can pause consumption or route messages to a retry topic until Redis recovers.
- **State Reconstruction**: Since Kafka retains transaction history for 24 hours, the 5-minute rolling window state can be reconstructed by replaying the last 5 minutes of Kafka events.

### 7. What Happens if Kafka Fails?
- The ingestion API catches delivery exceptions. Depending on configuration:
  - Synchronous fallback to a Dead Letter Queue (DLQ) or local buffer.
  - Returns HTTP 503 (Service Unavailable) so upstream UPI clients can retry according to standard exponential backoff protocol.

### 8. How are Duplicate Flags Prevented?
- A rolling window triggers continuously as new transactions arrive. Without deduplication, 5 rapid transactions could generate 3 redundant cluster records.
- **Cluster Fingerprinting**: StructShield calculates a SHA-256 fingerprint from `merchantId + payerId + sortedTxIds`.
- A 10-minute Redis cache stores `cluster:fp:{fingerprint}`. If a match is found, StructShield updates the existing cluster rather than creating a duplicate alert.

### 9. What are the Inherent System Limitations?
1. **Synthetic Data**: Simulated patterns, while mathematically representative, do not capture real-world user noise or novel evasion tactics.
2. **Static Thresholds**: ₹2,000 and 5-minute windows are fixed in v1; sophisticated fraudsters may space payments across 6 minutes or vary amounts between ₹1,500 and ₹2,100.
3. **Legitimate Split Payments**: Legitimate customers splitting a restaurant bill across multiple cards/wallets or paying in installments can trigger false positives, which is why analyst review is essential.

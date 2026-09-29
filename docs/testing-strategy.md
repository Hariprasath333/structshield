# StructShield — Testing & Quality Strategy

## 1. Test Pyramid Overview

```
         /\
        /  \        End-to-End Tests (Playwright: Web UI to Backend)
       /----\
      /      \      Integration Tests (Testcontainers: PostgreSQL + Kafka + Redis)
     /--------\
    /          \    Unit Tests (JUnit 5, Mockito: Detector, Risk Calculator, Store)
   /------------\
```

---

## 2. Test Layers

### 2.1 Backend Unit Tests
- **`StructuringDetectorTest`**:
  - Validates filtering: ignores amounts $> ₹2,000.
  - Cluster size boundary: 1 or 2 transactions do NOT form a cluster candidate.
  - Threshold triggers: exactly 3 and $>3$ transactions trigger candidate generation.
  - Time window boundary: transactions outside 5 minutes are pruned.
- **`RiskScoreCalculatorTest`**:
  - Boundary conditions: maximum score cap at 100.
  - Score accumulation: individual signal checks (tight vs loose timing, near-ceiling ratios, round target totals, device consistency).
  - Mixed scenarios: legitimate spread payments scoring below 70 threshold.
- **`RollingWindowStoreTest`**:
  - Redis sorted set window addition, retrieval, range queries, and TTL verification.

### 2.2 Integration Tests (Testcontainers)
- Spawns real ephemeral Docker containers for:
  - `PostgreSQL 16`
  - `Redis 7`
  - `Apache Kafka`
- Validates the end-to-end event lifecycle:
  `POST /api/transactions` $\to$ Kafka topic `transactions` $\to$ `TransactionConsumer` $\to$ `RollingWindowStore` $\to$ `StructuringDetector` $\to$ PostgreSQL `cluster` table $\to$ Kafka `flags` topic.

### 2.3 Frontend Tests (Vitest + React Testing Library)
- Tests `RiskBadge` rendering with appropriate styling per score tier.
- Tests `RiskSignalList` mathematical points and explanation visualization.
- Tests `FlagTable` sorting, filtering, and pagination.
- Tests `ReviewModal` state updates on confirm.

### 2.4 End-to-End Verification (Playwright)
- Executes synthetic structuring scenario:
  1. Ingests 3 rapid sub-₹2,000 transactions.
  2. Waits for detection and cluster persistence.
  3. Authenticates analyst in React UI.
  4. Verifies cluster appearance in flags table.
  5. Opens cluster detail and reviews signals.
  6. Submits review action and verifies state change to `REVIEWED`.

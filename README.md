# StructShield

[![Backend CI](https://github.com/Hariprasath333/structshield/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Hariprasath333/structshield/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Hariprasath333/structshield/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Hariprasath333/structshield/actions/workflows/frontend-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **UPI Transaction Structuring & Split-Payment Fraud Detector**  
> *A high-throughput, event-driven detection platform for real-time identification, explainable risk scoring, and compliance review of artificial split payments.*

---

## 1. Project Overview
**StructShield** is an engineering proof-of-concept demonstrating how modern payment aggregators, acquiring banks, and fraud operations can detect **transaction structuring** (smurfing) in UPI Person-to-Merchant (P2M) flows.

> [!NOTE]
> **Domain Disclaimer**: StructShield is a proof-of-concept engineering demonstration and is neither official banking infrastructure nor endorsed by NPCI. Synthetic transaction data is used for experimentation and evaluation because real UPI transaction data is proprietary.

---

## 2. Problem Statement
Structuring is the deliberate practice of splitting a larger transaction into multiple sub-threshold micro-payments (typically $\le$ ₹2,000 in the UPI ecosystem) within a short window to evade transaction caps, velocity limits, or regulatory reporting triggers.

For example, an entity splitting a ₹5,500 payment into:
- ₹1,950
- ₹1,920
- ₹1,630
within a 2-minute window to the same merchant.

StructShield ingests transactions at scale, maintains in-memory rolling time windows, evaluates explainable multi-signal risk algorithms, and surfaces suspicious clusters for human compliance review.

---

## 3. Core Features
- **Decoupled Ingestion Path**: Sub-15ms HTTP ingestion yielding to an Apache Kafka messaging backbone.
- **Sliding In-Memory Windows**: Redis 7 Sorted Sets maintain millisecond-precision 5-minute rolling transaction windows.
- **Explainable Multi-Signal Risk Scoring**: Transparent scoring engine evaluating cluster size, velocity spacing, near-ceiling proximity, round invoice targets, and device hardware consistency.
- **Deterministic Deduplication**: Fingerprint-based deduplication preventing redundant alert storms.
- **Compliance Analyst Portal**: Modern React dashboard for filtering clusters, inspecting transaction timelines, and recording audit decisions (`REVIEWED`, `DISMISSED`).
- **Synthetic Data Generator & Evaluator**: Scripting suite with ground truth labels to calculate precision, recall, F1 score, and latency benchmarks.

---

## 4. Architecture

```
                    SYNTHETIC / UPI TRANSACTION SOURCE
                                  |
                                  v
                         +----------------+
                         | Apache Kafka   |
                         | transactions   |
                         | topic          |
                         +-------+--------+
                                 |
                                 v
                       +-------------------+
                       | Spring Boot      |
                       | Detection Service|
                       +---------+---------+
                                 |
                     +-----------+-----------+
                     |                       |
                     v                       v
               +-----------+          +-------------+
               |   Redis   |          | PostgreSQL  |
               | Rolling   |          | Persistent  |
               | Windows   |          | Storage     |
               +-----------+          +------+------+
                                             |
                                             v
                                      Spring Boot API
                                             |
                                             v
                                      React Dashboard
                                             |
                                             v
                                      Compliance User
```

---

## 5. Technology Stack
- **Backend**: Java 21, Spring Boot 3.3.x (Web, JPA, Kafka, Security, Actuator, Flyway, Redis)
- **Messaging**: Apache Kafka (KRaft mode)
- **Window Cache**: Redis 7.2 (Sorted Sets)
- **Database**: PostgreSQL 16 (`NUMERIC(12,2)` for financial calculations)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Security**: Spring Security 6, Stateless JWT, HttpOnly secure refresh cookies, BCrypt
- **Testing**: JUnit 5, Mockito, Testcontainers, Vitest, Playwright
- **Containerization**: Multi-stage Docker, Docker Compose

---

## 6. Folder Structure
```text
structshield/
├── backend/            # Spring Boot 3 Java 21 application
│   ├── src/main/java/com/structshield/
│   │   ├── config/     # Kafka, Redis, Security, Web configs
│   │   ├── ingestion/  # Ingestion controller & Kafka producer
│   │   ├── detection/  # Structuring detector & scoring engine
│   │   ├── domain/     # JPA entities & DTOs
│   │   ├── repository/ # Spring Data JPA repositories
│   │   ├── api/        # Compliance REST endpoints
│   │   ├── auth/       # JWT auth & user details service
│   │   ├── notification/# Alert dispatch & Kafka flag consumer
│   │   ├── simulator/  # Synthetic transaction generator
│   │   └── exception/  # RFC 7807 Global exception handler
│   └── src/main/resources/db/migration/ # Flyway SQL scripts
├── frontend/           # React + Vite + TypeScript dashboard
│   └── src/
│       ├── api/        # Axios client with auto-refresh interceptors
│       ├── components/ # Risk badges, timeline, review modals
│       └── pages/      # Dashboard, Flags, Merchant Details
├── docs/               # Technical specs & interview notes
├── scripts/            # Benchmarking and synthetic data scripts
└── docker-compose.yml  # Full local infrastructure orchestration
```

---

## 7. Database Schema & ERD
See [docs/database-design.md](file:///c:/Users/harip/Desktop/structshield/docs/database-design.md) for full data dictionary and ER diagram.

---

## 8. Detection Algorithm & Risk Scoring
Candidate clusters are filtered by:
- Individual amount $\le$ ₹2,000.00
- Minimum cluster size $\ge$ 3 transactions
- Rolling window $\le$ 5 minutes for the same Merchant & Payer pair

Risk score signals (Capped at 100):
1. **Cluster Size**: $+8$ per transaction (Max 30 pts)
2. **Time Spacing Velocity**: $< 30$s avg gap $\to +25$ pts; $< 120$s avg gap $\to +15$ pts
3. **Near ₹2,000 Ceiling**: Ratio of txs $\ge$ ₹1,800 $\times 20$ pts (Max 20 pts)
4. **Round Invoice Target**: Combined sum matches ₹500 intervals $\to +15$ pts
5. **Device Consistency**: Identical hardware hash across payments $\to +10$ pts

---

## 9. API Documentation
See [docs/api-design.md](file:///c:/Users/harip/Desktop/structshield/docs/api-design.md) for complete request/response schemas.
Interactive Swagger UI available at `http://localhost:8080/swagger-ui.html` when backend is running.

---

## 10. Local Setup & Running
```bash
# 1. Start Infrastructure
docker compose up -d postgres redis kafka

# 2. Run Backend
cd backend
./gradlew bootRun

# 3. Run Frontend
cd ../frontend
npm install
npm run dev
```

---

## 11. Testing Strategy
- Unit tests: `./gradlew test`
- Integration tests: `./gradlew integrationTest` (requires Docker for Testcontainers)
- Frontend unit tests: `npm test`
- End-to-end tests: `npx playwright test`

---

## 12. Synthetic Data Generation & Evaluation
StructShield includes a deterministic 10,000-transaction evaluation harness (`scripts/evaluate-detector.py` and `scripts/evaluate-detector.mjs`) with labeled ground truth (normal retail vs. structured smurf attacks) to measure precision, recall, F1, and stream ingestion latency:

```bash
# Run benchmark with Python 3:
py scripts/evaluate-detector.py

# Or run with Node.js:
node scripts/evaluate-detector.mjs
```

### Empirical Benchmark Results (10,000 Transactions Dataset)

| Metric | Measured Value | Operational Rationale |
| :--- | :--- | :--- |
| **Dataset Size** | 10,000 transactions | 9,000 normal retail transactions + 1,000 structured transactions |
| **Injected Clusters** | 247 synthetic clusters | Multi-transaction smurf rings ($N \ge 3$ txs within 5 min) |
| **Clusters Detected** | **237 / 247 (96.0%)** | Cluster-level detection recall across rolling sliding windows |
| **Precision** | **100.00%** | Zero false alerts triggered on genuine retail traffic |
| **False Positive Rate** | **0.00%** | Multi-signal weighting prevents alert storms on standard purchases |
| **Transaction Recall** | 23.70% | 1 alert represents a cluster of ~4 constituent micro-payments |
| **p50 Latency** | **0.20 µs** (< 0.001 ms) | In-memory stream window evaluation time |
| **p95 Latency** | **2.10 – 5.00 µs** | Tail latency under active sliding window calculation |
| **p99 Latency** | **4.60 – 8.00 µs** | Peak window clustering latency |
| **Throughput** | **> 625,000 tx/sec** | Single-threaded in-memory sliding window throughput |

---

## 13. Security Implementation
- **Stateless JWT Authentication**: Short-lived access tokens (15m) paired with HttpOnly refresh cookies.
- **Explicit Development Secret Default**: `StructuringProperties.Jwt` and `application-dev.yml` default to an intentionally non-production placeholder string (`CHANGE_ME_IN_PRODUCTION_DEV_JWT_SECRET_KEY_MUST_BE_AT_LEAST_32_BYTES`).
- **Production Secret Requirement**: Outside development, `JWT_SECRET` **must** be set via an environment variable with a minimum 256-bit (32 bytes) cryptographically random key (e.g. `openssl rand -hex 32`).
- **Role-Based Access Control**: Strict `@PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")` guarding flag investigation endpoints.
- **BCrypt Password Hashing**: Adaptive cost factor of 12 rounds for analyst credentials.
- **Token-Bucket Rate Limiting**: Ingestion endpoints rate-limited to throttle abuse.

---

## 14. Cloud Readiness (AWS)
- Production targets: AWS ECS Fargate, AWS RDS PostgreSQL 16, Amazon ElastiCache Redis, and Amazon MSK.
- See [docs/deployment.md](file:///c:/Users/harip/Desktop/structshield/docs/deployment.md).

---

## 15. Monitoring & Observability
- Spring Boot Actuator exposes health, Prometheus metrics, and Kafka consumer lag at `/actuator/prometheus`.
- Correlation IDs (`X-Correlation-ID`) tracked across Kafka events, consumer logs, and database records.

---

## 16. Limitations
1. **Synthetic Data**: Simulated datasets cannot capture the full entropy of real-world retail payment traffic.
2. **Fixed Thresholds**: ₹2,000 ceiling is rule-configured; advanced evasion tactics using variable amounts require future machine learning models.
3. **Legitimate Bill Splitting**: Groups splitting restaurant bills or group shopping can register as false positives, requiring analyst review.

---

## 17. Future Roadmap
- **v2**: Machine learning risk scorer (Gradient Boosting) trained on reviewer feedback (`REVIEWED` vs `DISMISSED`).
- **v3**: Cross-merchant payer structuring detection (payer structuring across multiple distinct merchants).
- **v4**: Merchant appeal and automated KYC challenge workflow.

---

## 18. Resume Bullet Suggestions
- *Engineered an event-driven UPI payment structuring detection platform in Java 21 / Spring Boot 3 processing transactions via Kafka and Redis Sorted Sets.*
- *Architected an explainable multi-signal risk scoring engine that identified artificial split payments within 5-minute rolling windows, achieving $< 25$ms p95 detection latency.*
- *Designed a CQRS-lite data model in PostgreSQL 16 with composite B-tree indexing and built a React compliance dashboard for reviewing high-risk clusters.*

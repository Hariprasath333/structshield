# StructShield — Database Design & Schema Specification

## 1. Database Engine & Standards
- **RDBMS**: PostgreSQL 16
- **Migration Tool**: Flyway (`db/migration/V1__init_schema.sql`, `V2__add_indexes.sql`)
- **Primary Keys**: UUID v4 across all domain entities
- **Monetary Types**: `NUMERIC(12,2)` (Strictly no `FLOAT` or `DOUBLE`)
- **Timestamp Conventions**: `TIMESTAMPTZ` (UTC standard)

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    MERCHANT ||--o{ TRANSACTION : receives
    PAYER ||--o{ TRANSACTION : initiates
    MERCHANT ||--o{ CLUSTER : flags
    PAYER ||--o{ CLUSTER : involves
    CLUSTER ||--|{ CLUSTER_TRANSACTION : contains
    TRANSACTION ||--o{ CLUSTER_TRANSACTION : belongs_to
    USER ||--o{ REFRESH_TOKEN : owns

    MERCHANT {
        uuid id PK
        varchar(200) name
        varchar(100) upi_id UK
        numeric(5,2) aggregate_risk_score
        timestamptz created_at
    }

    PAYER {
        uuid id PK
        varchar(100) upi_handle UK
        varchar(128) device_hash
        timestamptz created_at
    }

    TRANSACTION {
        uuid id PK
        uuid merchant_id FK
        uuid payer_id FK
        numeric(12,2) amount
        varchar(100) invoice_ref
        varchar(128) device_hash
        varchar(20) status
        timestamptz occurred_at
        timestamptz created_at
    }

    CLUSTER {
        uuid id PK
        uuid merchant_id FK
        uuid payer_id FK
        numeric(12,2) total_amount
        integer transaction_count
        timestamptz window_start
        timestamptz window_end
        numeric(5,2) risk_score
        varchar(20) status
        varchar(100) reviewed_by
        timestamptz reviewed_at
        text review_notes
        timestamptz created_at
    }

    CLUSTER_TRANSACTION {
        uuid cluster_id PK,FK
        uuid transaction_id PK,FK
    }

    USER {
        uuid id PK
        varchar(50) username UK
        varchar(255) password_hash
        varchar(50) role
        boolean enabled
        timestamptz created_at
    }

    REFRESH_TOKEN {
        uuid id PK
        uuid user_id FK
        varchar(255) token_hash UK
        timestamptz expires_at
        boolean revoked
        timestamptz created_at
    }
```

---

## 3. Data Dictionary

### 3.1 `merchant` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique merchant UUID |
| `name` | `VARCHAR(200)` | `NOT NULL` | Business / store name |
| `upi_id` | `VARCHAR(100)` | `UNIQUE, NOT NULL`| Virtual Payment Address (e.g., `store@okhdfcbank`) |
| `aggregate_risk_score` | `NUMERIC(5,2)` | `DEFAULT 0.00` | Running composite risk score for the merchant (0–100) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Registration timestamp |

### 3.2 `payer` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique payer identifier |
| `upi_handle` | `VARCHAR(100)` | `UNIQUE, NOT NULL`| Payer VPA (e.g., `payer@icici`) |
| `device_hash` | `VARCHAR(128)` | `NULL` | Primary device hardware/client fingerprint |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Registration timestamp |

### 3.3 `transaction` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique transaction ID |
| `merchant_id` | `UUID` | `FK -> merchant(id)` | Receiving merchant |
| `payer_id` | `UUID` | `FK -> payer(id)` | Originating payer |
| `amount` | `NUMERIC(12,2)`| `CHECK (amount > 0)` | Financial transaction value |
| `invoice_ref` | `VARCHAR(100)` | `NULL` | Upstream invoice or bill number |
| `device_hash` | `VARCHAR(128)` | `NULL` | Hardware fingerprint captured at payment execution |
| `status` | `VARCHAR(20)` | `NOT NULL` | Transaction state (`SUCCESS`, `FAILED`, `PENDING`) |
| `occurred_at` | `TIMESTAMPTZ` | `NOT NULL` | Exact transaction timestamp at UPI switch |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Ingestion timestamp in StructShield |

### 3.4 `cluster` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Cluster ID |
| `merchant_id` | `UUID` | `FK -> merchant(id)` | Flagged merchant |
| `payer_id` | `UUID` | `FK -> payer(id)` | Flagged payer |
| `total_amount` | `NUMERIC(12,2)`| `NOT NULL` | Sum of all constituent transactions |
| `transaction_count`| `INTEGER` | `CHECK (count >= 1)`| Number of transactions in cluster |
| `window_start` | `TIMESTAMPTZ` | `NOT NULL` | Timestamp of earliest transaction in window |
| `window_end` | `TIMESTAMPTZ` | `NOT NULL` | Timestamp of latest transaction in window |
| `risk_score` | `NUMERIC(5,2)` | `NOT NULL` | Calculated score (0–100) |
| `status` | `VARCHAR(20)` | `NOT NULL` | `OPEN`, `REVIEWED`, `DISMISSED` |
| `reviewed_by` | `VARCHAR(100)` | `NULL` | Username of compliance officer |
| `reviewed_at` | `TIMESTAMPTZ` | `NULL` | Timestamp of analyst review decision |
| `review_notes` | `TEXT` | `NULL` | Explanatory review notes |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Cluster creation timestamp |

### 3.5 `cluster_transaction` Table
Composite primary key join table linking clusters and transactions:
- `cluster_id UUID REFERENCES cluster(id) ON DELETE CASCADE`
- `transaction_id UUID REFERENCES transaction(id) ON DELETE CASCADE`
- `PRIMARY KEY (cluster_id, transaction_id)`

---

## 4. Indexing Strategy (`V2__add_indexes.sql`)

```sql
-- 1. Optimizes time-window lookups for merchant-payer pairs
CREATE INDEX idx_transaction_merchant_payer_time 
    ON transaction(merchant_id, payer_id, occurred_at);

-- 2. Fast querying and filtering on compliance dashboard
CREATE INDEX idx_cluster_risk_status 
    ON cluster(risk_score DESC, status);

-- 3. Top-risk merchant queries for risk analytics
CREATE INDEX idx_merchant_aggregate_risk 
    ON merchant(aggregate_risk_score DESC);

-- 4. Payer velocity index
CREATE INDEX idx_transaction_payer_time 
    ON transaction(payer_id, occurred_at);
```

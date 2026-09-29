-- ==============================================================================
-- StructShield Flyway Migration V1: Initial Schema
-- ==============================================================================

-- 1. Merchant Table
CREATE TABLE merchant (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    upi_id VARCHAR(100) NOT NULL UNIQUE,
    aggregate_risk_score NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Payer Table
CREATE TABLE payer (
    id UUID PRIMARY KEY,
    upi_handle VARCHAR(100) NOT NULL UNIQUE,
    device_hash VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transaction Table
CREATE TABLE transaction (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchant(id),
    payer_id UUID NOT NULL REFERENCES payer(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    invoice_ref VARCHAR(100),
    device_hash VARCHAR(128),
    status VARCHAR(20) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cluster Table
CREATE TABLE cluster (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchant(id),
    payer_id UUID NOT NULL REFERENCES payer(id),
    total_amount NUMERIC(12, 2) NOT NULL,
    transaction_count INTEGER NOT NULL CHECK (transaction_count >= 1),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    risk_score NUMERIC(5, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- OPEN, REVIEWED, DISMISSED
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cluster Transaction Join Table
CREATE TABLE cluster_transaction (
    cluster_id UUID NOT NULL REFERENCES cluster(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transaction(id) ON DELETE CASCADE,
    PRIMARY KEY (cluster_id, transaction_id)
);

-- 6. User Table (Quoted "user" for PostgreSQL keyword compatibility)
CREATE TABLE "user" (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- ROLE_COMPLIANCE_ANALYST, ROLE_ADMIN
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Refresh Token Table
CREATE TABLE refresh_token (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

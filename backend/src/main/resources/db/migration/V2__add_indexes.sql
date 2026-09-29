-- ==============================================================================
-- StructShield Flyway Migration V2: Performance Indexes
-- ==============================================================================

-- 1. Index on transaction (merchant_id, payer_id, occurred_at) for rapid window lookups
CREATE INDEX idx_transaction_merchant_payer_occurred 
    ON transaction(merchant_id, payer_id, occurred_at);

-- 2. Index on cluster (risk_score, status) for fast compliance dashboard filtering & sorting
CREATE INDEX idx_cluster_risk_status 
    ON cluster(risk_score DESC, status);

-- 3. Index on merchant (aggregate_risk_score) for top-risk merchant queries
CREATE INDEX idx_merchant_aggregate_risk 
    ON merchant(aggregate_risk_score DESC);

-- 4. Index on transaction (payer_id, occurred_at) for payer velocity monitoring
CREATE INDEX idx_transaction_payer_occurred 
    ON transaction(payer_id, occurred_at);

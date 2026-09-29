package com.structshield.detection;

import com.structshield.ingestion.TransactionEvent;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ClusterCandidate(
        String merchantUpiId,
        String merchantName,
        String payerUpiHandle,
        List<TransactionEvent> transactions,
        BigDecimal totalAmount,
        int transactionCount,
        Instant windowStart,
        Instant windowEnd,
        RiskScoreResult riskScoreResult,
        boolean isFlagWorthy
) {}

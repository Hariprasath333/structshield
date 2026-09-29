package com.structshield.ingestion;

import com.structshield.domain.TransactionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionEvent(
        UUID transactionId,
        String merchantUpiId,
        String merchantName,
        String payerUpiHandle,
        BigDecimal amount,
        String invoiceRef,
        String deviceHash,
        TransactionStatus status,
        Instant occurredAt,
        String syntheticLabel // Optional: "NORMAL" or "STRUCTURED" for evaluation
) {}

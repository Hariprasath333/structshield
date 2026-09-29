package com.structshield.ingestion;

import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
        UUID transactionId,
        String status,
        Instant ingestedAt,
        String message
) {
    public static TransactionResponse accepted(UUID transactionId) {
        return new TransactionResponse(
                transactionId,
                "QUEUED_FOR_EVALUATION",
                Instant.now(),
                "Transaction received and submitted to real-time detection pipeline"
        );
    }
}

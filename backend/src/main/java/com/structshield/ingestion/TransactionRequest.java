package com.structshield.ingestion;

import com.structshield.domain.TransactionStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionRequest(
        @NotBlank(message = "Merchant UPI ID is required")
        @Pattern(regexp = "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z0-9]{2,64}$", message = "Invalid UPI ID format")
        String merchantUpiId,

        String merchantName,

        @NotBlank(message = "Payer UPI handle is required")
        @Pattern(regexp = "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z0-9]{2,64}$", message = "Invalid UPI handle format")
        String payerUpiHandle,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be strictly greater than 0")
        BigDecimal amount,

        Instant occurredAt,

        String deviceHash,

        String invoiceRef,

        TransactionStatus status,

        String syntheticLabel
) {}

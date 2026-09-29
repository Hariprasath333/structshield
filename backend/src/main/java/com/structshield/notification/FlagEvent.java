package com.structshield.notification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FlagEvent(
        UUID clusterId,
        UUID merchantId,
        String merchantUpiId,
        String payerUpiHandle,
        BigDecimal totalAmount,
        int transactionCount,
        BigDecimal riskScore,
        Instant detectedAt,
        List<String> reasons
) {}

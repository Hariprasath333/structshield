package com.structshield.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MerchantRiskResponse(
        UUID id,
        String name,
        String upiId,
        BigDecimal aggregateRiskScore,
        Instant createdAt,
        List<FlagResponse> recentClusters
) {}

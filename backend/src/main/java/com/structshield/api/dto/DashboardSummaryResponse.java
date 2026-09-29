package com.structshield.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        long totalClusters,
        long openFlags,
        long reviewedFlags,
        long dismissedFlags,
        long monitoredMerchants,
        BigDecimal averageRiskScore,
        List<FlagResponse> recentFlags
) {}

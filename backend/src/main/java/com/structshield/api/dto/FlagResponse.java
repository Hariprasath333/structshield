package com.structshield.api.dto;

import com.structshield.domain.Cluster;
import com.structshield.domain.ClusterStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FlagResponse(
        UUID id,
        MerchantInfo merchant,
        PayerInfo payer,
        BigDecimal totalAmount,
        int transactionCount,
        Instant windowStart,
        Instant windowEnd,
        BigDecimal riskScore,
        ClusterStatus status,
        String reviewedBy,
        Instant reviewedAt,
        Instant createdAt
) {
    public record MerchantInfo(UUID id, String name, String upiId, BigDecimal aggregateRiskScore) {}
    public record PayerInfo(UUID id, String upiHandle, String deviceHash) {}

    public static FlagResponse from(Cluster cluster) {
        return new FlagResponse(
                cluster.getId(),
                new MerchantInfo(
                        cluster.getMerchant().getId(),
                        cluster.getMerchant().getName(),
                        cluster.getMerchant().getUpiId(),
                        cluster.getMerchant().getAggregateRiskScore()
                ),
                new PayerInfo(
                        cluster.getPayer().getId(),
                        cluster.getPayer().getUpiHandle(),
                        cluster.getPayer().getDeviceHash()
                ),
                cluster.getTotalAmount(),
                cluster.getTransactionCount(),
                cluster.getWindowStart(),
                cluster.getWindowEnd(),
                cluster.getRiskScore(),
                cluster.getStatus(),
                cluster.getReviewedBy(),
                cluster.getReviewedAt(),
                cluster.getCreatedAt()
        );
    }
}

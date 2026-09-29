package com.structshield.api.dto;

import com.structshield.detection.RiskSignal;
import com.structshield.domain.Cluster;
import com.structshield.domain.ClusterStatus;
import com.structshield.domain.Transaction;
import com.structshield.domain.TransactionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FlagDetailResponse(
        UUID id,
        FlagResponse.MerchantInfo merchant,
        FlagResponse.PayerInfo payer,
        BigDecimal totalAmount,
        int transactionCount,
        Instant windowStart,
        Instant windowEnd,
        BigDecimal riskScore,
        ClusterStatus status,
        String reviewedBy,
        Instant reviewedAt,
        String reviewNotes,
        Instant createdAt,
        List<TransactionItem> transactions,
        List<RiskSignal> signals
) {
    public record TransactionItem(
            UUID id,
            BigDecimal amount,
            String invoiceRef,
            String deviceHash,
            TransactionStatus status,
            Instant occurredAt
    ) {
        public static TransactionItem from(Transaction tx) {
            return new TransactionItem(
                    tx.getId(),
                    tx.getAmount(),
                    tx.getInvoiceRef(),
                    tx.getDeviceHash(),
                    tx.getStatus(),
                    tx.getOccurredAt()
            );
        }
    }

    public static FlagDetailResponse from(Cluster cluster, List<RiskSignal> signals) {
        List<TransactionItem> txList = cluster.getTransactions().stream()
                .map(TransactionItem::from)
                .sorted((a, b) -> a.occurredAt().compareTo(b.occurredAt()))
                .toList();

        return new FlagDetailResponse(
                cluster.getId(),
                new FlagResponse.MerchantInfo(
                        cluster.getMerchant().getId(),
                        cluster.getMerchant().getName(),
                        cluster.getMerchant().getUpiId(),
                        cluster.getMerchant().getAggregateRiskScore()
                ),
                new FlagResponse.PayerInfo(
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
                cluster.getReviewNotes(),
                cluster.getCreatedAt(),
                txList,
                signals
        );
    }
}

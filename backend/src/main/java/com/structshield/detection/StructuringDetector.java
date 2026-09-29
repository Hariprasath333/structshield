package com.structshield.detection;

import com.structshield.config.StructuringProperties;
import com.structshield.ingestion.TransactionEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class StructuringDetector {

    private static final Logger log = LoggerFactory.getLogger(StructuringDetector.class);

    private final RollingWindowStore windowStore;
    private final RiskScoreCalculator riskScoreCalculator;
    private final StructuringProperties properties;

    public StructuringDetector(
            RollingWindowStore windowStore,
            RiskScoreCalculator riskScoreCalculator,
            StructuringProperties properties
    ) {
        this.windowStore = windowStore;
        this.riskScoreCalculator = riskScoreCalculator;
        this.properties = properties;
    }

    public Optional<ClusterCandidate> processTransaction(TransactionEvent event) {
        BigDecimal structuringThreshold = properties.getDetection().getThreshold();

        // 1. Filter: Transactions strictly greater than the threshold are not structuring candidates
        if (event.amount() == null || event.amount().compareTo(structuringThreshold) > 0) {
            log.debug("Transaction [{}] amount [₹{}] exceeds structuring threshold [₹{}], skipping window addition",
                    event.transactionId(), event.amount(), structuringThreshold);
            return Optional.empty();
        }

        String merchantKey = event.merchantUpiId();
        String payerKey = event.payerUpiHandle();
        Instant eventTime = event.occurredAt() != null ? event.occurredAt() : Instant.now();
        Instant windowStart = eventTime.minus(Duration.ofMinutes(properties.getDetection().getWindowMinutes()));

        // 2. Add to Redis sliding window
        windowStore.add(merchantKey, payerKey, event);

        // 3. Remove transactions that occurred before the rolling window start
        windowStore.removeExpired(merchantKey, payerKey, windowStart);

        // 4. Retrieve rolling window transactions
        List<TransactionEvent> windowTransactions = windowStore.getWindow(merchantKey, payerKey, windowStart, eventTime);

        // 5. Check minimum cluster size (e.g. >= 3)
        int minSize = properties.getDetection().getMinClusterSize();
        if (windowTransactions.size() < minSize) {
            log.debug("Window for merchant [{}] and payer [{}] has [{}] transactions (< min [{}])",
                    merchantKey, payerKey, windowTransactions.size(), minSize);
            return Optional.empty();
        }

        // 6. Calculate total amount & time span
        List<TransactionEvent> sortedTxs = windowTransactions.stream()
                .sorted(Comparator.comparing(TransactionEvent::occurredAt))
                .toList();

        BigDecimal totalAmount = sortedTxs.stream()
                .map(TransactionEvent::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Instant firstTxTime = sortedTxs.get(0).occurredAt();
        Instant lastTxTime = sortedTxs.get(sortedTxs.size() - 1).occurredAt();

        // 7. Calculate explainable risk score
        RiskScoreResult riskScoreResult = riskScoreCalculator.calculateRisk(sortedTxs);
        boolean isFlagWorthy = riskScoreResult.totalScore().compareTo(properties.getDetection().getRiskThreshold()) >= 0;

        log.info("Structuring candidate evaluated: merchant=[{}], payer=[{}], count=[{}], total=[₹{}], score=[{}] (flagWorthy={})",
                merchantKey, payerKey, sortedTxs.size(), totalAmount, riskScoreResult.totalScore(), isFlagWorthy);

        ClusterCandidate candidate = new ClusterCandidate(
                merchantKey,
                event.merchantName(),
                payerKey,
                sortedTxs,
                totalAmount,
                sortedTxs.size(),
                firstTxTime,
                lastTxTime,
                riskScoreResult,
                isFlagWorthy
        );

        return Optional.of(candidate);
    }
}

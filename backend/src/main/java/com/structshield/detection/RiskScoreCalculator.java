package com.structshield.detection;

import com.structshield.config.StructuringProperties;
import com.structshield.ingestion.TransactionEvent;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class RiskScoreCalculator {

    private final StructuringProperties properties;

    public RiskScoreCalculator(StructuringProperties properties) {
        this.properties = properties;
    }

    public RiskScoreResult calculateRisk(List<TransactionEvent> transactions) {
        List<RiskSignal> signals = new ArrayList<>();
        double accumulatedScore = 0.0;

        if (transactions == null || transactions.isEmpty()) {
            return new RiskScoreResult(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), List.of());
        }

        int count = transactions.size();

        // Signal 1: Cluster Size
        double sizePoints = Math.min(count * 8.0, 30.0);
        signals.add(new RiskSignal(
                SignalType.CLUSTER_SIZE,
                sizePoints,
                30.0,
                String.format("%d small payments detected in rolling window", count)
        ));
        accumulatedScore += sizePoints;

        // Signal 2: Time Spacing
        List<TransactionEvent> sortedTxs = transactions.stream()
                .sorted(Comparator.comparing(TransactionEvent::occurredAt))
                .toList();

        long firstTime = sortedTxs.get(0).occurredAt().toEpochMilli();
        long lastTime = sortedTxs.get(count - 1).occurredAt().toEpochMilli();
        double timeSpanSeconds = (lastTime - firstTime) / 1000.0;
        double avgGap = count > 1 ? timeSpanSeconds / (count - 1) : 0.0;

        double spacingPoints = 0.0;
        String spacingExplanation;
        if (avgGap < 30.0) {
            spacingPoints = 25.0;
            spacingExplanation = String.format("Average payment gap was %.1f seconds (< 30s velocity trigger)", avgGap);
        } else if (avgGap < 120.0) {
            spacingPoints = 15.0;
            spacingExplanation = String.format("Average payment gap was %.1f seconds (< 120s velocity trigger)", avgGap);
        } else {
            spacingPoints = 0.0;
            spacingExplanation = String.format("Average payment gap was %.1f seconds (normal pacing)", avgGap);
        }
        signals.add(new RiskSignal(SignalType.TIME_SPACING, spacingPoints, 25.0, spacingExplanation));
        accumulatedScore += spacingPoints;

        // Signal 3: Near ₹2,000 Ceiling
        BigDecimal nearCeiling = properties.getDetection().getNearCeilingAmount();
        long nearCeilingCount = transactions.stream()
                .filter(t -> t.amount() != null && t.amount().compareTo(nearCeiling) >= 0)
                .count();

        double nearRatio = (double) nearCeilingCount / count;
        double nearPoints = Math.round(nearRatio * 20.0 * 100.0) / 100.0;
        signals.add(new RiskSignal(
                SignalType.NEAR_THRESHOLD,
                nearPoints,
                20.0,
                String.format("%d of %d payments (%.1f%%) were >= ₹%s",
                        nearCeilingCount, count, nearRatio * 100.0, nearCeiling.toPlainString())
        ));
        accumulatedScore += nearPoints;

        // Signal 4: Round Total Resemblance
        BigDecimal total = transactions.stream()
                .map(TransactionEvent::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double totalDouble = total.doubleValue();
        double remainder = totalDouble % properties.getDetection().getRoundingUnit().doubleValue();
        boolean isRoundInvoice = remainder < 1.0 || remainder > (properties.getDetection().getRoundingUnit().doubleValue() - 1.0);

        double roundPoints = 0.0;
        if (isRoundInvoice) {
            roundPoints = 15.0;
            signals.add(new RiskSignal(
                    SignalType.ROUND_TOTAL,
                    roundPoints,
                    15.0,
                    String.format("Combined amount (₹%.2f) resembles a round invoice multiple", totalDouble)
            ));
        } else {
            signals.add(new RiskSignal(
                    SignalType.ROUND_TOTAL,
                    0.0,
                    15.0,
                    String.format("Combined amount (₹%.2f) does not match round invoice target", totalDouble)
            ));
        }
        accumulatedScore += roundPoints;

        // Signal 5: Device Consistency
        boolean sameDevice = false;
        String firstDevice = sortedTxs.get(0).deviceHash();
        if (firstDevice != null && !firstDevice.isBlank()) {
            sameDevice = sortedTxs.stream()
                    .allMatch(t -> firstDevice.equals(t.deviceHash()));
        }

        double devicePoints = sameDevice ? 10.0 : 0.0;
        signals.add(new RiskSignal(
                SignalType.DEVICE_CONSISTENCY,
                devicePoints,
                10.0,
                sameDevice ? "All payments originated from the same device hardware fingerprint"
                        : "Payments originated from multiple or unspecified devices"
        ));
        accumulatedScore += devicePoints;

        // Cap at 100
        double finalScore = Math.min(100.0, accumulatedScore);
        BigDecimal scoreBigDecimal = BigDecimal.valueOf(finalScore).setScale(2, RoundingMode.HALF_UP);

        return new RiskScoreResult(scoreBigDecimal, signals);
    }
}

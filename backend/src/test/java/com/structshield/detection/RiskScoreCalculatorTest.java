package com.structshield.detection;

import com.structshield.config.StructuringProperties;
import com.structshield.domain.TransactionStatus;
import com.structshield.ingestion.TransactionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RiskScoreCalculatorTest {

    private RiskScoreCalculator calculator;
    private StructuringProperties properties;

    @BeforeEach
    void setUp() {
        properties = new StructuringProperties();
        calculator = new RiskScoreCalculator(properties);
    }

    @Test
    @DisplayName("Should score high on typical structured payment pattern (tight timing, near threshold, round sum, same device)")
    void shouldScoreHighOnStructuringPattern() {
        Instant now = Instant.parse("2026-09-20T15:00:00Z");

        // 3 payments: ₹1950, ₹1920, ₹1630 = ₹5500 (multiple of 500), gap: 20 seconds, same device
        TransactionEvent t1 = createTx(new BigDecimal("1950.00"), now, "device_abc");
        TransactionEvent t2 = createTx(new BigDecimal("1920.00"), now.plusSeconds(20), "device_abc");
        TransactionEvent t3 = createTx(new BigDecimal("1630.00"), now.plusSeconds(40), "device_abc");

        RiskScoreResult result = calculator.calculateRisk(List.of(t1, t2, t3));

        assertNotNull(result);
        // Cluster size: 3 * 8 = 24
        // Spacing: avg 20s < 30s = 25
        // Near ceiling: 2/3 (1950, 1920 >= 1800) -> 13.33
        // Round total: 5500 % 500 == 0 -> 15
        // Device consistency: same device -> 10
        // Expected: 24 + 25 + 13.33 + 15 + 10 = 87.33
        assertTrue(result.totalScore().compareTo(new BigDecimal("80.00")) >= 0);
        assertTrue(result.totalScore().compareTo(new BigDecimal("90.00")) <= 0);

        assertEquals(5, result.signals().size());
    }

    @Test
    @DisplayName("Should cap score at 100 even with many transactions")
    void shouldCapScoreAt100() {
        Instant now = Instant.parse("2026-09-20T15:00:00Z");

        // 6 transactions of ₹2000 each (total ₹12,000 = multiple of 500), spaced by 10s, same device
        List<TransactionEvent> txs = List.of(
                createTx(new BigDecimal("2000.00"), now, "dev_1"),
                createTx(new BigDecimal("2000.00"), now.plusSeconds(10), "dev_1"),
                createTx(new BigDecimal("2000.00"), now.plusSeconds(20), "dev_1"),
                createTx(new BigDecimal("2000.00"), now.plusSeconds(30), "dev_1"),
                createTx(new BigDecimal("2000.00"), now.plusSeconds(40), "dev_1"),
                createTx(new BigDecimal("2000.00"), now.plusSeconds(50), "dev_1")
        );

        RiskScoreResult result = calculator.calculateRisk(txs);
        assertEquals(0, result.totalScore().compareTo(new BigDecimal("100.00")));
    }

    @Test
    @DisplayName("Should score lower on legitimate spaced transactions with different amounts and devices")
    void shouldScoreLowerOnLegitimateSpreadPayments() {
        Instant now = Instant.parse("2026-09-20T15:00:00Z");

        // 3 payments spaced across 4 minutes (avg gap 120s), small varied amounts (not near 1800), different devices
        TransactionEvent t1 = createTx(new BigDecimal("250.00"), now, "dev_1");
        TransactionEvent t2 = createTx(new BigDecimal("410.00"), now.plusSeconds(130), "dev_2");
        TransactionEvent t3 = createTx(new BigDecimal("320.00"), now.plusSeconds(260), "dev_3");

        RiskScoreResult result = calculator.calculateRisk(List.of(t1, t2, t3));

        // Total: 980 (not multiple of 500)
        // Spacing: 130s > 120s -> 0
        // Near threshold: 0
        // Device: different -> 0
        // Cluster size: 24
        // Total score = 24.00 (< 70 threshold)
        assertTrue(result.totalScore().compareTo(new BigDecimal("40.00")) < 0);
    }

    @Test
    @DisplayName("Should return 0 for empty transaction list")
    void shouldReturnZeroForEmptyList() {
        RiskScoreResult result = calculator.calculateRisk(List.of());
        assertEquals(0, result.totalScore().compareTo(BigDecimal.ZERO));
    }

    private TransactionEvent createTx(BigDecimal amount, Instant time, String deviceHash) {
        return new TransactionEvent(
                UUID.randomUUID(),
                "test.merchant@icici",
                "Test Merchant",
                "test.payer@hdfc",
                amount,
                "INV-123",
                deviceHash,
                TransactionStatus.SUCCESS,
                time,
                "TEST"
        );
    }
}

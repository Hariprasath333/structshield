package com.structshield.detection;

import com.structshield.config.StructuringProperties;
import com.structshield.domain.TransactionStatus;
import com.structshield.ingestion.TransactionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StructuringDetectorTest {

    @Mock
    private RollingWindowStore windowStore;

    private RiskScoreCalculator riskScoreCalculator;
    private StructuringProperties properties;
    private StructuringDetector detector;

    @BeforeEach
    void setUp() {
        properties = new StructuringProperties();
        riskScoreCalculator = new RiskScoreCalculator(properties);
        detector = new StructuringDetector(windowStore, riskScoreCalculator, properties);
    }

    @Test
    @DisplayName("Should ignore transaction strictly greater than ₹2,000 threshold")
    void shouldIgnoreTransactionsAboveThreshold() {
        TransactionEvent tx = createTx(new BigDecimal("2000.01"), Instant.now());

        Optional<ClusterCandidate> result = detector.processTransaction(tx);

        assertTrue(result.isEmpty());
        verifyNoInteractions(windowStore);
    }

    @Test
    @DisplayName("Should not produce candidate when window has fewer than 3 transactions")
    void shouldNotFlagWhenLessThan3Transactions() {
        TransactionEvent tx1 = createTx(new BigDecimal("1900.00"), Instant.now());
        TransactionEvent tx2 = createTx(new BigDecimal("1850.00"), Instant.now().plusSeconds(15));

        when(windowStore.getWindow(eq(tx2.merchantUpiId()), eq(tx2.payerUpiHandle()), any(), any()))
                .thenReturn(List.of(tx1, tx2));

        Optional<ClusterCandidate> result = detector.processTransaction(tx2);

        assertTrue(result.isEmpty());
        verify(windowStore).add(eq(tx2.merchantUpiId()), eq(tx2.payerUpiHandle()), eq(tx2));
    }

    @Test
    @DisplayName("Should produce flag-worthy candidate when 3 structured transactions arrive")
    void shouldFlagWhen3StructuredTransactionsArrive() {
        Instant now = Instant.now();
        TransactionEvent tx1 = createTx(new BigDecimal("1950.00"), now);
        TransactionEvent tx2 = createTx(new BigDecimal("1920.00"), now.plusSeconds(20));
        TransactionEvent tx3 = createTx(new BigDecimal("1630.00"), now.plusSeconds(40));

        when(windowStore.getWindow(eq(tx3.merchantUpiId()), eq(tx3.payerUpiHandle()), any(), any()))
                .thenReturn(List.of(tx1, tx2, tx3));

        Optional<ClusterCandidate> result = detector.processTransaction(tx3);

        assertTrue(result.isPresent());
        ClusterCandidate candidate = result.get();
        assertEquals(3, candidate.transactionCount());
        assertEquals(new BigDecimal("5500.00"), candidate.totalAmount());
        assertTrue(candidate.isFlagWorthy());
        assertTrue(candidate.riskScoreResult().totalScore().compareTo(new BigDecimal("70.00")) >= 0);
    }

    private TransactionEvent createTx(BigDecimal amount, Instant time) {
        return new TransactionEvent(
                UUID.randomUUID(),
                "apex.store@icici",
                "Apex Store",
                "rahul@hdfc",
                amount,
                "INV-01",
                "device_123",
                TransactionStatus.SUCCESS,
                time,
                "TEST"
        );
    }
}

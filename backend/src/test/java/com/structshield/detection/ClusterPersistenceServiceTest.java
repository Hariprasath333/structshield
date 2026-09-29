package com.structshield.detection;

import com.structshield.domain.*;
import com.structshield.ingestion.TransactionEvent;
import com.structshield.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClusterPersistenceServiceTest {

    @Mock
    private MerchantRepository merchantRepository;
    @Mock
    private PayerRepository payerRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private ClusterRepository clusterRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private ClusterPersistenceService persistenceService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        persistenceService = new ClusterPersistenceService(
                merchantRepository,
                payerRepository,
                transactionRepository,
                clusterRepository,
                redisTemplate
        );
    }

    @Test
    @DisplayName("Should create and persist new cluster and update merchant aggregate score")
    void shouldPersistNewCluster() {
        UUID merchantId = UUID.randomUUID();
        Merchant merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setUpiId("merchant@upi");
        merchant.setName("Merchant Name");
        merchant.setAggregateRiskScore(BigDecimal.ZERO);

        UUID payerId = UUID.randomUUID();
        Payer payer = new Payer();
        payer.setId(payerId);
        payer.setUpiHandle("payer@upi");

        when(merchantRepository.findByUpiId("merchant@upi")).thenReturn(Optional.of(merchant));
        when(payerRepository.findByUpiHandle("payer@upi")).thenReturn(Optional.of(payer));
        when(transactionRepository.findById(any())).thenReturn(Optional.empty());
        when(transactionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        when(valueOperations.get(startsWith("cluster:fp:"))).thenReturn(null);
        when(clusterRepository.findActiveByMerchantAndPayer(merchantId, payerId)).thenReturn(Collections.emptyList());
        when(clusterRepository.save(any())).thenAnswer(invocation -> {
            Cluster c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        Instant now = Instant.now();
        List<TransactionEvent> txEvents = List.of(
                createEvent(new BigDecimal("1900.00"), now),
                createEvent(new BigDecimal("1850.00"), now.plusSeconds(10)),
                createEvent(new BigDecimal("1250.00"), now.plusSeconds(20))
        );

        RiskScoreResult riskResult = new RiskScoreResult(
                new BigDecimal("85.00"),
                Collections.emptyList()
        );

        ClusterCandidate candidate = new ClusterCandidate(
                "merchant@upi",
                "Merchant Name",
                "payer@upi",
                txEvents,
                new BigDecimal("5000.00"),
                3,
                now,
                now.plusSeconds(20),
                riskResult,
                true
        );

        Cluster saved = persistenceService.persistClusterCandidate(candidate);

        assertNotNull(saved);
        assertEquals(new BigDecimal("5000.00"), saved.getTotalAmount());
        assertEquals(3, saved.getTransactionCount());
        assertEquals(ClusterStatus.OPEN, saved.getStatus());

        // Verify fingerprint cached in Redis
        verify(valueOperations).set(startsWith("cluster:fp:"), eq(saved.getId().toString()), any());

        // Verify merchant aggregate risk updated
        assertEquals(new BigDecimal("85.00"), merchant.getAggregateRiskScore());
        verify(merchantRepository).save(merchant);
    }

    @Test
    @DisplayName("Should return existing cluster when fingerprint match is found in Redis cache")
    void shouldReturnCachedClusterOnDuplicateFingerprint() {
        UUID merchantId = UUID.randomUUID();
        Merchant merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setUpiId("merchant@upi");

        UUID payerId = UUID.randomUUID();
        Payer payer = new Payer();
        payer.setId(payerId);
        payer.setUpiHandle("payer@upi");

        when(merchantRepository.findByUpiId("merchant@upi")).thenReturn(Optional.of(merchant));
        when(payerRepository.findByUpiHandle("payer@upi")).thenReturn(Optional.of(payer));
        when(transactionRepository.findById(any())).thenReturn(Optional.empty());
        when(transactionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UUID existingClusterId = UUID.randomUUID();
        Cluster existingCluster = new Cluster();
        existingCluster.setId(existingClusterId);
        existingCluster.setStatus(ClusterStatus.OPEN);

        when(valueOperations.get(startsWith("cluster:fp:"))).thenReturn(existingClusterId.toString());
        when(clusterRepository.findById(existingClusterId)).thenReturn(Optional.of(existingCluster));

        Instant now = Instant.now();
        List<TransactionEvent> txEvents = List.of(createEvent(new BigDecimal("1900.00"), now));
        RiskScoreResult riskResult = new RiskScoreResult(new BigDecimal("80.00"), Collections.emptyList());
        ClusterCandidate candidate = new ClusterCandidate(
                "merchant@upi",
                "Merchant",
                "payer@upi",
                txEvents,
                new BigDecimal("1900.00"),
                1,
                now,
                now,
                riskResult,
                true
        );

        Cluster result = persistenceService.persistClusterCandidate(candidate);

        assertEquals(existingClusterId, result.getId());
        verify(clusterRepository, never()).save(any());
    }

    private TransactionEvent createEvent(BigDecimal amount, Instant time) {
        return new TransactionEvent(
                UUID.randomUUID(),
                "merchant@upi",
                "Merchant Name",
                "payer@upi",
                amount,
                "INV-100",
                "device_hash_1",
                TransactionStatus.SUCCESS,
                time,
                "STRUCTURED"
        );
    }
}

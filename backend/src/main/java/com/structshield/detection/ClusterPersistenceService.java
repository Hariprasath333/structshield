package com.structshield.detection;

import com.structshield.domain.*;
import com.structshield.ingestion.TransactionEvent;
import com.structshield.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClusterPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(ClusterPersistenceService.class);
    private static final Duration FINGERPRINT_TTL = Duration.ofMinutes(10);

    private final MerchantRepository merchantRepository;
    private final PayerRepository payerRepository;
    private final TransactionRepository transactionRepository;
    private final ClusterRepository clusterRepository;
    private final StringRedisTemplate redisTemplate;

    public ClusterPersistenceService(
            MerchantRepository merchantRepository,
            PayerRepository payerRepository,
            TransactionRepository transactionRepository,
            ClusterRepository clusterRepository,
            StringRedisTemplate redisTemplate
    ) {
        this.merchantRepository = merchantRepository;
        this.payerRepository = payerRepository;
        this.transactionRepository = transactionRepository;
        this.clusterRepository = clusterRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Cluster persistClusterCandidate(ClusterCandidate candidate) {
        // 1. Resolve or create Merchant
        Merchant merchant = merchantRepository.findByUpiId(candidate.merchantUpiId())
                .orElseGet(() -> {
                    Merchant m = new Merchant();
                    m.setUpiId(candidate.merchantUpiId());
                    m.setName(candidate.merchantName() != null ? candidate.merchantName() : candidate.merchantUpiId());
                    m.setCreatedAt(Instant.now());
                    return merchantRepository.save(m);
                });

        // 2. Resolve or create Payer
        Payer payer = payerRepository.findByUpiHandle(candidate.payerUpiHandle())
                .orElseGet(() -> {
                    Payer p = new Payer();
                    p.setUpiHandle(candidate.payerUpiHandle());
                    String device = candidate.transactions().isEmpty() ? null : candidate.transactions().get(0).deviceHash();
                    p.setDeviceHash(device);
                    p.setCreatedAt(Instant.now());
                    return payerRepository.save(p);
                });

        // 3. Persist individual transactions if not already in DB
        Set<Transaction> persistedTransactions = new HashSet<>();
        for (TransactionEvent event : candidate.transactions()) {
            Transaction tx = transactionRepository.findById(event.transactionId())
                    .orElseGet(() -> {
                        Transaction t = new Transaction();
                        t.setId(event.transactionId());
                        t.setMerchant(merchant);
                        t.setPayer(payer);
                        t.setAmount(event.amount());
                        t.setInvoiceRef(event.invoiceRef());
                        t.setDeviceHash(event.deviceHash());
                        t.setStatus(event.status() != null ? event.status() : TransactionStatus.SUCCESS);
                        t.setOccurredAt(event.occurredAt());
                        t.setCreatedAt(Instant.now());
                        return transactionRepository.save(t);
                    });
            persistedTransactions.add(tx);
        }

        // 4. Compute cluster fingerprint for deduplication
        String fingerprint = generateFingerprint(merchant.getId(), payer.getId(), candidate.transactions());
        String redisFpKey = "cluster:fp:" + fingerprint;

        String existingClusterId = redisTemplate.opsForValue().get(redisFpKey);
        if (existingClusterId != null) {
            Optional<Cluster> existing = clusterRepository.findById(UUID.fromString(existingClusterId));
            if (existing.isPresent()) {
                log.debug("Cluster with fingerprint [{}] already persisted with ID [{}]", fingerprint, existingClusterId);
                return existing.get();
            }
        }

        // 5. Check if active OPEN cluster exists for this merchant and payer
        List<Cluster> activeClusters = clusterRepository.findActiveByMerchantAndPayer(merchant.getId(), payer.getId());
        Cluster cluster;

        if (!activeClusters.isEmpty()) {
            cluster = activeClusters.get(0);
            cluster.setTotalAmount(candidate.totalAmount());
            cluster.setTransactionCount(candidate.transactionCount());
            cluster.setWindowEnd(candidate.windowEnd());
            cluster.setRiskScore(candidate.riskScoreResult().totalScore());
            cluster.getTransactions().addAll(persistedTransactions);
            log.info("Updated existing active cluster [{}] with new transactions", cluster.getId());
        } else {
            cluster = new Cluster();
            cluster.setMerchant(merchant);
            cluster.setPayer(payer);
            cluster.setTotalAmount(candidate.totalAmount());
            cluster.setTransactionCount(candidate.transactionCount());
            cluster.setWindowStart(candidate.windowStart());
            cluster.setWindowEnd(candidate.windowEnd());
            cluster.setRiskScore(candidate.riskScoreResult().totalScore());
            cluster.setStatus(ClusterStatus.OPEN);
            cluster.setTransactions(persistedTransactions);
            cluster.setCreatedAt(Instant.now());
            log.info("Created new high-risk cluster [{}] for merchant [{}] and payer [{}]",
                    cluster.getId(), merchant.getUpiId(), payer.getUpiHandle());
        }

        Cluster savedCluster = clusterRepository.save(cluster);

        // 6. Cache fingerprint to avoid reprocessing identical set within window
        redisTemplate.opsForValue().set(redisFpKey, savedCluster.getId().toString(), FINGERPRINT_TTL);

        // 7. Update merchant aggregate risk score
        updateMerchantRisk(merchant, candidate.riskScoreResult().totalScore());

        return savedCluster;
    }

    private void updateMerchantRisk(Merchant merchant, java.math.BigDecimal latestScore) {
        // Weighted average / max of high risk scores
        if (merchant.getAggregateRiskScore().compareTo(latestScore) < 0) {
            merchant.setAggregateRiskScore(latestScore);
            merchantRepository.save(merchant);
        }
    }

    private String generateFingerprint(UUID merchantId, UUID payerId, List<TransactionEvent> transactions) {
        String sortedTxIds = transactions.stream()
                .map(t -> t.transactionId().toString())
                .sorted()
                .collect(Collectors.joining(","));

        String raw = merchantId + ":" + payerId + ":" + sortedTxIds;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }
}

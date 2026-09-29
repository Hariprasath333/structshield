package com.structshield.ingestion;

import com.structshield.detection.ClusterCandidate;
import com.structshield.detection.ClusterPersistenceService;
import com.structshield.detection.StructuringDetector;
import com.structshield.domain.Cluster;
import com.structshield.notification.FlagEvent;
import com.structshield.notification.FlagProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class TransactionConsumer {

    private static final Logger log = LoggerFactory.getLogger(TransactionConsumer.class);

    private final StructuringDetector structuringDetector;
    private final ClusterPersistenceService persistenceService;
    private final FlagProducer flagProducer;

    public TransactionConsumer(
            StructuringDetector structuringDetector,
            ClusterPersistenceService persistenceService,
            FlagProducer flagProducer
    ) {
        this.structuringDetector = structuringDetector;
        this.persistenceService = persistenceService;
        this.flagProducer = flagProducer;
    }

    @KafkaListener(
            topics = "#{@structuringProperties.topics.transactions}",
            groupId = "${spring.kafka.consumer.group-id:structshield-detection-group}"
    )
    public void consumeTransaction(TransactionEvent event) {
        log.debug("TransactionConsumer processing transaction event [{}] for merchant [{}] and payer [{}]",
                event.transactionId(), event.merchantUpiId(), event.payerUpiHandle());

        try {
            Optional<ClusterCandidate> candidateOpt = structuringDetector.processTransaction(event);

            if (candidateOpt.isPresent()) {
                ClusterCandidate candidate = candidateOpt.get();

                if (candidate.isFlagWorthy()) {
                    log.warn("Cluster candidate for merchant [{}] exceeded risk threshold with score [{}]",
                            candidate.merchantUpiId(), candidate.riskScoreResult().totalScore());

                    // 1. Transactionally persist cluster and associations in PostgreSQL
                    Cluster persistedCluster = persistenceService.persistClusterCandidate(candidate);

                    // 2. Publish flag event to Kafka
                    List<String> reasons = candidate.riskScoreResult().signals().stream()
                            .filter(s -> s.points() > 0)
                            .map(s -> String.format("[%s: +%.1f pts] %s", s.name(), s.points(), s.explanation()))
                            .toList();

                    FlagEvent flagEvent = new FlagEvent(
                            persistedCluster.getId(),
                            persistedCluster.getMerchant().getId(),
                            persistedCluster.getMerchant().getUpiId(),
                            persistedCluster.getPayer().getUpiHandle(),
                            persistedCluster.getTotalAmount(),
                            persistedCluster.getTransactionCount(),
                            persistedCluster.getRiskScore(),
                            Instant.now(),
                            reasons
                    );

                    flagProducer.publishFlag(flagEvent);
                }
            }
        } catch (Exception e) {
            log.error("Unhandled error processing transaction event [{}]: {}", event.transactionId(), e.getMessage(), e);
            throw e; // Allow Kafka error handler / retry logic to engage
        }
    }
}

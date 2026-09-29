package com.structshield.ingestion;

import com.structshield.config.StructuringProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class TransactionProducer {

    private static final Logger log = LoggerFactory.getLogger(TransactionProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StructuringProperties properties;

    public TransactionProducer(KafkaTemplate<String, Object> kafkaTemplate, StructuringProperties properties) {
        this.kafkaTemplate = kafkaTemplate;
        this.properties = properties;
    }

    public CompletableFuture<Void> sendTransaction(TransactionEvent event) {
        String topic = properties.getTopics().getTransactions();
        // Keying on merchant + payer preserves strict chronological ordering on Kafka partitions
        String partitionKey = event.merchantUpiId() + ":" + event.payerUpiHandle();

        log.debug("Publishing transaction event [{}] to topic [{}] with key [{}]",
                event.transactionId(), topic, partitionKey);

        return kafkaTemplate.send(topic, partitionKey, event)
                .thenAccept(result -> log.debug("Transaction [{}] successfully delivered to partition [{}] at offset [{}]",
                        event.transactionId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset()))
                .exceptionally(ex -> {
                    log.error("Failed to publish transaction [{}] to Kafka: {}", event.transactionId(), ex.getMessage(), ex);
                    return null;
                });
    }
}

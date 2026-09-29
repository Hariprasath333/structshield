package com.structshield.notification;

import com.structshield.config.StructuringProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class FlagProducer {

    private static final Logger log = LoggerFactory.getLogger(FlagProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StructuringProperties properties;

    public FlagProducer(KafkaTemplate<String, Object> kafkaTemplate, StructuringProperties properties) {
        this.kafkaTemplate = kafkaTemplate;
        this.properties = properties;
    }

    public void publishFlag(FlagEvent flagEvent) {
        String topic = properties.getTopics().getFlags();
        String key = flagEvent.clusterId().toString();

        log.info("Publishing high-risk FlagEvent [{}] for cluster [{}] to topic [{}]",
                flagEvent.clusterId(), flagEvent.merchantUpiId(), topic);

        kafkaTemplate.send(topic, key, flagEvent)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish FlagEvent [{}] to Kafka: {}", flagEvent.clusterId(), ex.getMessage(), ex);
                    } else {
                        log.debug("FlagEvent [{}] published to partition [{}] offset [{}]",
                                flagEvent.clusterId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}

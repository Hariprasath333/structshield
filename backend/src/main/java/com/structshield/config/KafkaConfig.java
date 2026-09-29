package com.structshield.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@EnableKafka
public class KafkaConfig {

    private final StructuringProperties properties;

    public KafkaConfig(StructuringProperties properties) {
        this.properties = properties;
    }

    @Bean
    public NewTopic transactionsTopic() {
        return TopicBuilder.name(properties.getTopics().getTransactions())
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic flagsTopic() {
        return TopicBuilder.name(properties.getTopics().getFlags())
                .partitions(3)
                .replicas(1)
                .build();
    }
}

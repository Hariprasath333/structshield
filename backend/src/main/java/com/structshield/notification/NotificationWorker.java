package com.structshield.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationWorker {

    private static final Logger log = LoggerFactory.getLogger(NotificationWorker.class);

    private final NotificationService notificationService;

    public NotificationWorker(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(
            topics = "#{@structuringProperties.topics.flags}",
            groupId = "structshield-notification-group"
    )
    public void handleFlagEvent(FlagEvent flagEvent) {
        log.info("NotificationWorker received FlagEvent for cluster [{}]", flagEvent.clusterId());
        try {
            notificationService.sendFlagNotification(flagEvent);
        } catch (Exception e) {
            log.error("Failed to process notification for cluster [{}]: {}", flagEvent.clusterId(), e.getMessage(), e);
        }
    }
}

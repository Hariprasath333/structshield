package com.structshield.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LoggingNotificationService implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationService.class);

    @Override
    public void sendFlagNotification(FlagEvent flagEvent) {
        log.warn("================================================================================");
        log.warn("🚨 [STRUCTSHIELD COMPLIANCE ALERT] High-Risk Structuring Cluster Detected!");
        log.warn("Cluster ID      : {}", flagEvent.clusterId());
        log.warn("Merchant UPI    : {}", flagEvent.merchantUpiId());
        log.warn("Payer Handle    : {}", flagEvent.payerUpiHandle());
        log.warn("Total Amount    : ₹{}", flagEvent.totalAmount());
        log.warn("Tx Count        : {}", flagEvent.transactionCount());
        log.warn("Risk Score      : {} / 100.0", flagEvent.riskScore());
        log.warn("Detected At     : {}", flagEvent.detectedAt());
        log.warn("Reasons / Breakdown:");
        if (flagEvent.reasons() != null) {
            for (String reason : flagEvent.reasons()) {
                log.warn("   * {}", reason);
            }
        }
        log.warn("================================================================================");
    }
}

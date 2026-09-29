package com.structshield.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
@ConfigurationProperties(prefix = "structshield")
public class StructuringProperties {

    private Topics topics = new Topics();
    private Detection detection = new Detection();
    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();

    public static class Topics {
        private String transactions = "transactions";
        private String flags = "flags";

        public String getTransactions() {
            return transactions;
        }

        public void setTransactions(String transactions) {
            this.transactions = transactions;
        }

        public String getFlags() {
            return flags;
        }

        public void setFlags(String flags) {
            this.flags = flags;
        }
    }

    public static class Detection {
        private BigDecimal threshold = new BigDecimal("2000.00");
        private int minClusterSize = 3;
        private int windowMinutes = 5;
        private BigDecimal nearCeilingAmount = new BigDecimal("1800.00");
        private BigDecimal riskThreshold = new BigDecimal("70.00");
        private BigDecimal roundingUnit = new BigDecimal("500.00");

        public BigDecimal getThreshold() {
            return threshold;
        }

        public void setThreshold(BigDecimal threshold) {
            this.threshold = threshold;
        }

        public int getMinClusterSize() {
            return minClusterSize;
        }

        public void setMinClusterSize(int minClusterSize) {
            this.minClusterSize = minClusterSize;
        }

        public int getWindowMinutes() {
            return windowMinutes;
        }

        public void setWindowMinutes(int windowMinutes) {
            this.windowMinutes = windowMinutes;
        }

        public BigDecimal getNearCeilingAmount() {
            return nearCeilingAmount;
        }

        public void setNearCeilingAmount(BigDecimal nearCeilingAmount) {
            this.nearCeilingAmount = nearCeilingAmount;
        }

        public BigDecimal getRiskThreshold() {
            return riskThreshold;
        }

        public void setRiskThreshold(BigDecimal riskThreshold) {
            this.riskThreshold = riskThreshold;
        }

        public BigDecimal getRoundingUnit() {
            return roundingUnit;
        }

        public void setRoundingUnit(BigDecimal roundingUnit) {
            this.roundingUnit = roundingUnit;
        }
    }

    public static class Jwt {
        private String secret = "CHANGE_ME_IN_PRODUCTION_DEV_JWT_SECRET_KEY_MUST_BE_AT_LEAST_32_BYTES";
        private long expirationMs = 900000;
        private long refreshExpirationMs = 604800000;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getExpirationMs() {
            return expirationMs;
        }

        public void setExpirationMs(long expirationMs) {
            this.expirationMs = expirationMs;
        }

        public long getRefreshExpirationMs() {
            return refreshExpirationMs;
        }

        public void setRefreshExpirationMs(long refreshExpirationMs) {
            this.refreshExpirationMs = refreshExpirationMs;
        }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:5173,http://localhost:3000";

        public String getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public Topics getTopics() {
        return topics;
    }

    public void setTopics(Topics topics) {
        this.topics = topics;
    }

    public Detection getDetection() {
        return detection;
    }

    public void setDetection(Detection detection) {
        this.detection = detection;
    }

    public Jwt getJwt() {
        return jwt;
    }

    public void setJwt(Jwt jwt) {
        this.jwt = jwt;
    }

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }
}

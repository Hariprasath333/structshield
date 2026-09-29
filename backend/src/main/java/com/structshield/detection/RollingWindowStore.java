package com.structshield.detection;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.structshield.ingestion.TransactionEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Component
public class RollingWindowStore {

    private static final Logger log = LoggerFactory.getLogger(RollingWindowStore.class);
    private static final Duration WINDOW_KEY_TTL = Duration.ofMinutes(10);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RollingWindowStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public String buildKey(String merchantId, String payerId) {
        return "window:" + merchantId + ":" + payerId;
    }

    public void add(String merchantId, String payerId, TransactionEvent event) {
        String key = buildKey(merchantId, payerId);
        double score = event.occurredAt().toEpochMilli();

        try {
            String jsonValue = objectMapper.writeValueAsString(event);
            redisTemplate.opsForZSet().add(key, jsonValue, score);
            redisTemplate.expire(key, WINDOW_KEY_TTL);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize transaction event [{}] for Redis window", event.transactionId(), e);
        }
    }

    public List<TransactionEvent> getWindow(String merchantId, String payerId, Instant windowStart, Instant windowEnd) {
        String key = buildKey(merchantId, payerId);
        double minScore = windowStart.toEpochMilli();
        double maxScore = windowEnd.toEpochMilli();

        Set<String> members = redisTemplate.opsForZSet().rangeByScore(key, minScore, maxScore);
        if (members == null || members.isEmpty()) {
            return Collections.emptyList();
        }

        List<TransactionEvent> events = new ArrayList<>();
        for (String member : members) {
            try {
                TransactionEvent event = objectMapper.readValue(member, TransactionEvent.class);
                events.add(event);
            } catch (JsonProcessingException e) {
                log.warn("Corrupt transaction record found in Redis key [{}]: {}", key, member);
            }
        }
        return events;
    }

    public long removeExpired(String merchantId, String payerId, Instant expiryThreshold) {
        String key = buildKey(merchantId, payerId);
        double maxExpiredScore = expiryThreshold.toEpochMilli();
        Long removedCount = redisTemplate.opsForZSet().removeRangeByScore(key, Double.NEGATIVE_INFINITY, maxExpiredScore);
        return removedCount != null ? removedCount : 0L;
    }

    public void cleanup(String merchantId, String payerId) {
        String key = buildKey(merchantId, payerId);
        redisTemplate.delete(key);
    }
}

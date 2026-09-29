package com.structshield.detection;

import com.structshield.domain.TransactionStatus;
import com.structshield.ingestion.TransactionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RollingWindowStoreTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ZSetOperations<String, String> zSetOperations;

    private RollingWindowStore store;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        store = new RollingWindowStore(redisTemplate);
    }

    @Test
    @DisplayName("Should format Redis key as window:merchantId:payerId")
    void shouldBuildExpectedKey() {
        String key = store.buildKey("merchant@upi", "payer@upi");
        assertEquals("window:merchant@upi:payer@upi", key);
    }

    @Test
    @DisplayName("Should add transaction to Redis ZSET with epoch timestamp as score and set 10m TTL")
    void shouldAddTransactionAndSetTtl() {
        Instant now = Instant.parse("2026-09-20T10:00:00Z");
        TransactionEvent event = new TransactionEvent(
                UUID.randomUUID(),
                "store@upi",
                "Store",
                "shopper@upi",
                new BigDecimal("1500.00"),
                "INV-101",
                "hash_abc",
                TransactionStatus.SUCCESS,
                now,
                "NORMAL"
        );

        store.add("store@upi", "shopper@upi", event);

        String expectedKey = "window:store@upi:shopper@upi";
        verify(zSetOperations).add(eq(expectedKey), contains("1500.00"), eq((double) now.toEpochMilli()));
        verify(redisTemplate).expire(eq(expectedKey), eq(Duration.ofMinutes(10)));
    }

    @Test
    @DisplayName("Should retrieve transactions within the specified score window")
    void shouldGetWindowTransactions() {
        Instant start = Instant.parse("2026-09-20T10:00:00Z");
        Instant end = Instant.parse("2026-09-20T10:05:00Z");
        String key = "window:store@upi:shopper@upi";

        String jsonEvent = """
                {
                    "transactionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                    "merchantUpiId": "store@upi",
                    "merchantName": "Store",
                    "payerUpiHandle": "shopper@upi",
                    "amount": 1950.00,
                    "invoiceRef": "INV-1",
                    "deviceHash": "dev_1",
                    "status": "SUCCESS",
                    "occurredAt": "2026-09-20T10:02:00Z",
                    "syntheticLabel": "STRUCTURED"
                }
                """;

        Set<String> members = new LinkedHashSet<>(Collections.singletonList(jsonEvent));
        when(zSetOperations.rangeByScore(eq(key), eq((double) start.toEpochMilli()), eq((double) end.toEpochMilli())))
                .thenReturn(members);

        List<TransactionEvent> result = store.getWindow("store@upi", "shopper@upi", start, end);

        assertEquals(1, result.size());
        TransactionEvent retrieved = result.get(0);
        assertEquals(new BigDecimal("1950.00"), retrieved.amount());
        assertEquals("store@upi", retrieved.merchantUpiId());
        assertEquals("shopper@upi", retrieved.payerUpiHandle());
        assertEquals("STRUCTURED", retrieved.syntheticLabel());
    }

    @Test
    @DisplayName("Should return empty list when no Redis members exist in range")
    void shouldReturnEmptyListWhenNoRecordsFound() {
        Instant start = Instant.now().minus(Duration.ofMinutes(5));
        Instant end = Instant.now();

        when(zSetOperations.rangeByScore(anyString(), anyDouble(), anyDouble()))
                .thenReturn(null);

        List<TransactionEvent> result = store.getWindow("store@upi", "shopper@upi", start, end);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should remove expired transactions older than cutoff timestamp")
    void shouldRemoveExpiredTransactions() {
        Instant cutoff = Instant.parse("2026-09-20T09:55:00Z");
        String expectedKey = "window:store@upi:shopper@upi";

        when(zSetOperations.removeRangeByScore(eq(expectedKey), eq(Double.NEGATIVE_INFINITY), eq((double) cutoff.toEpochMilli())))
                .thenReturn(3L);

        long removed = store.removeExpired("store@upi", "shopper@upi", cutoff);

        assertEquals(3L, removed);
        verify(zSetOperations).removeRangeByScore(eq(expectedKey), eq(Double.NEGATIVE_INFINITY), eq((double) cutoff.toEpochMilli()));
    }

    @Test
    @DisplayName("Should delete key on cleanup")
    void shouldCleanupKey() {
        store.cleanup("store@upi", "shopper@upi");
        verify(redisTemplate).delete("window:store@upi:shopper@upi");
    }
}

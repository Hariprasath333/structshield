package com.structshield.simulator;

import com.structshield.domain.TransactionStatus;
import com.structshield.ingestion.TransactionEvent;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
public class SyntheticDataGenerator {

    private final Random random = new Random(42); // Fixed seed for reproducibility

    private final List<String> merchantPool = List.of(
            "apex.store@icici", "metro.mart@hdfc", "quickpay.retail@sbi",
            "urban.goods@axis", "nexus.electronics@kotak", "royal.bazaar@yesbank"
    );

    private final List<String> merchantNames = List.of(
            "Apex Department Store", "Metro SuperMart", "QuickPay Retailers",
            "Urban Lifestyle Goods", "Nexus Electronics", "Royal Bazaar"
    );

    private final List<String> payerPool = List.of(
            "rahul.verma@okhdfcbank", "priya.sharma@paytm", "arjun.nair@icici",
            "ananya.iyer@axl", "vikram.singh@sbi", "deepak.gupta@ybl",
            "sneha.patel@okaxis", "rohit.kumar@kotak", "kavita.deshmukh@hdfc"
    );

    private final List<String> devices = List.of(
            "dev_hash_a1b2c3d4e5f6", "dev_hash_f6e5d4c3b2a1", "dev_hash_998877665544",
            "dev_hash_112233445566", "dev_hash_556677889900", "dev_hash_aabbccddeeff"
    );

    public List<TransactionEvent> generateBatch(int count, double structuringRatio) {
        List<TransactionEvent> events = new ArrayList<>();
        Instant baseTime = Instant.now().minus(10, ChronoUnit.MINUTES);

        int structuredTxCount = (int) Math.round(count * structuringRatio);
        int normalTxCount = count - structuredTxCount;

        // Generate normal transactions
        for (int i = 0; i < normalTxCount; i++) {
            events.add(generateNormalTransaction(baseTime.plusSeconds(i * 3L)));
        }

        // Generate structured transaction clusters
        int clusterIdx = 0;
        int remainingStructured = structuredTxCount;
        while (remainingStructured > 0) {
            int clusterSize = Math.min(Math.max(3, random.nextInt(4) + 3), remainingStructured); // 3 to 6
            List<TransactionEvent> cluster = generateStructuredCluster(
                    clusterIdx++,
                    clusterSize,
                    baseTime.plusSeconds((long) random.nextInt(300))
            );
            events.addAll(cluster);
            remainingStructured -= clusterSize;
        }

        // Shuffle slightly to simulate realistic interleaved streaming arrival
        events.sort(Comparator.comparing(TransactionEvent::occurredAt));
        return events;
    }

    public TransactionEvent generateNormalTransaction(Instant time) {
        int mIdx = random.nextInt(merchantPool.size());
        int pIdx = random.nextInt(payerPool.size());
        int dIdx = random.nextInt(devices.size());

        // Varied amounts from ₹50 to ₹15,000
        double rawAmount = 50.0 + (random.nextDouble() * 8000.0);
        BigDecimal amount = BigDecimal.valueOf(rawAmount).setScale(2, RoundingMode.HALF_UP);

        return new TransactionEvent(
                UUID.randomUUID(),
                merchantPool.get(mIdx),
                merchantNames.get(mIdx),
                payerPool.get(pIdx),
                amount,
                "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                devices.get(dIdx),
                TransactionStatus.SUCCESS,
                time,
                "NORMAL"
        );
    }

    public List<TransactionEvent> generateStructuredCluster(int clusterId, int size, Instant startTime) {
        int mIdx = random.nextInt(merchantPool.size());
        int pIdx = random.nextInt(payerPool.size());
        String merchantUpi = merchantPool.get(mIdx);
        String merchantName = merchantNames.get(mIdx);
        String payerUpi = payerPool.get(pIdx);
        String sharedDevice = devices.get(random.nextInt(devices.size()));

        // Target a round invoice total, e.g., ₹5,000, ₹6,000, ₹8,000
        double targetTotal = (size <= 3 ? 5000.0 : (size <= 4 ? 6000.0 : 8000.0));
        double targetPerTx = targetTotal / size; // typically ₹1,600 - ₹1,950

        List<TransactionEvent> cluster = new ArrayList<>();
        double accumulated = 0.0;
        Instant current = startTime;

        for (int i = 0; i < size; i++) {
            double amountDouble;
            if (i == size - 1) {
                amountDouble = targetTotal - accumulated;
            } else {
                // Keep individual amount <= ₹2,000 and near the ceiling
                double variance = (random.nextDouble() * 160.0) - 80.0;
                amountDouble = Math.min(1980.0, Math.max(1600.0, targetPerTx + variance));
                accumulated += amountDouble;
            }

            BigDecimal amount = BigDecimal.valueOf(amountDouble).setScale(2, RoundingMode.HALF_UP);

            // Velocity spacing: 10 to 35 seconds apart
            current = current.plusSeconds(12 + random.nextInt(25));

            cluster.add(new TransactionEvent(
                    UUID.randomUUID(),
                    merchantUpi,
                    merchantName,
                    payerUpi,
                    amount,
                    "INV-STRUCT-" + clusterId + "-" + (i + 1),
                    sharedDevice, // Same device fingerprint
                    TransactionStatus.SUCCESS,
                    current,
                    "STRUCTURED"
            ));
        }

        return cluster;
    }
}

package com.structshield.repository;

import com.structshield.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    @Query("SELECT t FROM Transaction t WHERE t.merchant.id = :merchantId AND t.payer.id = :payerId AND t.occurredAt >= :since ORDER BY t.occurredAt ASC")
    List<Transaction> findByMerchantAndPayerSince(
            @Param("merchantId") UUID merchantId,
            @Param("payerId") UUID payerId,
            @Param("since") Instant since
    );

    List<Transaction> findByPayerIdAndOccurredAtAfter(UUID payerId, Instant since);
}

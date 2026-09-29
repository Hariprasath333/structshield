package com.structshield.repository;

import com.structshield.domain.Cluster;
import com.structshield.domain.ClusterStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClusterRepository extends JpaRepository<Cluster, UUID>, JpaSpecificationExecutor<Cluster> {

    @EntityGraph(attributePaths = {"merchant", "payer"})
    @Query("SELECT c FROM Cluster c WHERE " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:minRisk IS NULL OR c.riskScore >= :minRisk) AND " +
            "(:maxRisk IS NULL OR c.riskScore <= :maxRisk) AND " +
            "(:merchantId IS NULL OR c.merchant.id = :merchantId)")
    Page<Cluster> findClustersWithFilters(
            @Param("status") ClusterStatus status,
            @Param("minRisk") BigDecimal minRisk,
            @Param("maxRisk") BigDecimal maxRisk,
            @Param("merchantId") UUID merchantId,
            Pageable pageable
    );

    @Override
    @EntityGraph(attributePaths = {"merchant", "payer"})
    Page<Cluster> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"merchant", "payer", "transactions"})
    Optional<Cluster> findById(UUID id);

    long countByStatus(ClusterStatus status);

    @Query("SELECT AVG(c.riskScore) FROM Cluster c")
    Optional<Double> findAverageRiskScore();

    @EntityGraph(attributePaths = {"merchant", "payer"})
    @Query("SELECT c FROM Cluster c WHERE c.merchant.id = :merchantId ORDER BY c.createdAt DESC")
    List<Cluster> findRecentByMerchantId(@Param("merchantId") UUID merchantId, Pageable pageable);

    @EntityGraph(attributePaths = {"merchant", "payer"})
    @Query("SELECT c FROM Cluster c WHERE c.merchant.id = :merchantId AND c.payer.id = :payerId AND c.status = 'OPEN' ORDER BY c.createdAt DESC")
    List<Cluster> findActiveByMerchantAndPayer(@Param("merchantId") UUID merchantId, @Param("payerId") UUID payerId);
}

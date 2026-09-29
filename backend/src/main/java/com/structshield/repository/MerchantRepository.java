package com.structshield.repository;

import com.structshield.domain.Merchant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, UUID> {
    Optional<Merchant> findByUpiId(String upiId);
    Page<Merchant> findAllByOrderByAggregateRiskScoreDesc(Pageable pageable);
}

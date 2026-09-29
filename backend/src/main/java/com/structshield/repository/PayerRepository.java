package com.structshield.repository;

import com.structshield.domain.Payer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayerRepository extends JpaRepository<Payer, UUID> {
    Optional<Payer> findByUpiHandle(String upiHandle);
}

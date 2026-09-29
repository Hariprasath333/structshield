package com.structshield.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "merchant")
public class Merchant {

    @Id
    private UUID id;

    @NotBlank
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank
    @Column(name = "upi_id", nullable = false, unique = true, length = 100)
    private String upiId;

    @NotNull
    @Column(name = "aggregate_risk_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal aggregateRiskScore = BigDecimal.ZERO;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Merchant() {
        this.id = UUID.randomUUID();
    }

    public Merchant(UUID id, String name, String upiId, BigDecimal aggregateRiskScore, Instant createdAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.name = name;
        this.upiId = upiId;
        this.aggregateRiskScore = aggregateRiskScore != null ? aggregateRiskScore : BigDecimal.ZERO;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public BigDecimal getAggregateRiskScore() {
        return aggregateRiskScore;
    }

    public void setAggregateRiskScore(BigDecimal aggregateRiskScore) {
        this.aggregateRiskScore = aggregateRiskScore;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

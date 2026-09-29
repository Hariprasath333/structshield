package com.structshield.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payer")
public class Payer {

    @Id
    private UUID id;

    @NotBlank
    @Column(name = "upi_handle", nullable = false, unique = true, length = 100)
    private String upiHandle;

    @Column(name = "device_hash", length = 128)
    private String deviceHash;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Payer() {
        this.id = UUID.randomUUID();
    }

    public Payer(UUID id, String upiHandle, String deviceHash, Instant createdAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.upiHandle = upiHandle;
        this.deviceHash = deviceHash;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUpiHandle() {
        return upiHandle;
    }

    public void setUpiHandle(String upiHandle) {
        this.upiHandle = upiHandle;
    }

    public String getDeviceHash() {
        return deviceHash;
    }

    public void setDeviceHash(String deviceHash) {
        this.deviceHash = deviceHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

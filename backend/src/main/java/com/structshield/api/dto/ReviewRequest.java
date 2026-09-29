package com.structshield.api.dto;

import com.structshield.domain.ClusterStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
        @NotNull(message = "Review status is required (REVIEWED or DISMISSED)")
        ClusterStatus status,

        String reviewNotes
) {}

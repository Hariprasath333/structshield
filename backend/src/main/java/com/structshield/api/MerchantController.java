package com.structshield.api;

import com.structshield.api.dto.FlagResponse;
import com.structshield.api.dto.MerchantRiskResponse;
import com.structshield.api.dto.PagedResponse;
import com.structshield.domain.Cluster;
import com.structshield.domain.Merchant;
import com.structshield.repository.ClusterRepository;
import com.structshield.repository.MerchantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/merchants")
@Tag(name = "Merchants", description = "Merchant risk profiles and monitoring")
public class MerchantController {

    private final MerchantRepository merchantRepository;
    private final ClusterRepository clusterRepository;

    public MerchantController(MerchantRepository merchantRepository, ClusterRepository clusterRepository) {
        this.merchantRepository = merchantRepository;
        this.clusterRepository = clusterRepository;
    }

    @GetMapping
    @Operation(summary = "List monitored merchants sorted by aggregate risk score")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    public ResponseEntity<PagedResponse<Merchant>> getMerchants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<Merchant> merchants = merchantRepository.findAllByOrderByAggregateRiskScoreDesc(pageable);
        return ResponseEntity.ok(PagedResponse.from(merchants));
    }

    @GetMapping("/{id}/risk")
    @Operation(summary = "Get detailed risk profile and historical clusters for a merchant")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    public ResponseEntity<MerchantRiskResponse> getMerchantRisk(@PathVariable UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Merchant not found: " + id));

        List<Cluster> recentClusters = clusterRepository.findRecentByMerchantId(id, PageRequest.of(0, 10));
        List<FlagResponse> clusterResponses = recentClusters.stream()
                .map(FlagResponse::from)
                .toList();

        MerchantRiskResponse response = new MerchantRiskResponse(
                merchant.getId(),
                merchant.getName(),
                merchant.getUpiId(),
                merchant.getAggregateRiskScore(),
                merchant.getCreatedAt(),
                clusterResponses
        );

        return ResponseEntity.ok(response);
    }
}

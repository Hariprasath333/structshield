package com.structshield.api;

import com.structshield.api.dto.DashboardSummaryResponse;
import com.structshield.api.dto.FlagResponse;
import com.structshield.domain.Cluster;
import com.structshield.domain.ClusterStatus;
import com.structshield.repository.ClusterRepository;
import com.structshield.repository.MerchantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Compliance summary metrics and risk distribution")
public class DashboardController {

    private final ClusterRepository clusterRepository;
    private final MerchantRepository merchantRepository;

    public DashboardController(ClusterRepository clusterRepository, MerchantRepository merchantRepository) {
        this.clusterRepository = clusterRepository;
        this.merchantRepository = merchantRepository;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get high-level compliance dashboard metrics")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        long totalClusters = clusterRepository.count();
        long openFlags = clusterRepository.countByStatus(ClusterStatus.OPEN);
        long reviewedFlags = clusterRepository.countByStatus(ClusterStatus.REVIEWED);
        long dismissedFlags = clusterRepository.countByStatus(ClusterStatus.DISMISSED);
        long monitoredMerchants = merchantRepository.count();

        Double avgScore = clusterRepository.findAverageRiskScore().orElse(0.0);
        BigDecimal averageRiskScore = BigDecimal.valueOf(avgScore).setScale(1, RoundingMode.HALF_UP);

        List<Cluster> recent = clusterRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        List<FlagResponse> recentFlags = recent.stream()
                .map(FlagResponse::from)
                .toList();

        DashboardSummaryResponse response = new DashboardSummaryResponse(
                totalClusters,
                openFlags,
                reviewedFlags,
                dismissedFlags,
                monitoredMerchants,
                averageRiskScore,
                recentFlags
        );

        return ResponseEntity.ok(response);
    }
}

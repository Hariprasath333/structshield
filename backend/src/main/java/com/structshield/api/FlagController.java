package com.structshield.api;

import com.structshield.api.dto.FlagDetailResponse;
import com.structshield.api.dto.FlagResponse;
import com.structshield.api.dto.PagedResponse;
import com.structshield.api.dto.ReviewRequest;
import com.structshield.detection.RiskScoreCalculator;
import com.structshield.detection.RiskScoreResult;
import com.structshield.domain.Cluster;
import com.structshield.domain.ClusterStatus;
import com.structshield.ingestion.TransactionEvent;
import com.structshield.repository.ClusterRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flags")
@Tag(name = "Compliance Flags", description = "Query and review suspicious transaction clusters")
public class FlagController {

    private final ClusterRepository clusterRepository;
    private final RiskScoreCalculator riskScoreCalculator;

    public FlagController(ClusterRepository clusterRepository, RiskScoreCalculator riskScoreCalculator) {
        this.clusterRepository = clusterRepository;
        this.riskScoreCalculator = riskScoreCalculator;
    }

    @GetMapping
    @Operation(summary = "Query paginated, filterable compliance flags")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    public ResponseEntity<PagedResponse<FlagResponse>> getFlags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ClusterStatus status,
            @RequestParam(required = false) BigDecimal minRisk,
            @RequestParam(required = false) BigDecimal maxRisk,
            @RequestParam(required = false) UUID merchantId,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, sortField));
        Page<Cluster> clusterPage = clusterRepository.findClustersWithFilters(status, minRisk, maxRisk, merchantId, pageable);

        Page<FlagResponse> responsePage = clusterPage.map(FlagResponse::from);
        return ResponseEntity.ok(PagedResponse.from(responsePage));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get deep dive cluster details with transaction timeline and explainable signals")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<FlagDetailResponse> getFlagDetail(@PathVariable UUID id) {
        Cluster cluster = clusterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cluster flag not found: " + id));

        // Reconstruct explainable signals from constituent transactions
        List<TransactionEvent> txEvents = cluster.getTransactions().stream()
                .map(t -> new TransactionEvent(
                        t.getId(),
                        cluster.getMerchant().getUpiId(),
                        cluster.getMerchant().getName(),
                        cluster.getPayer().getUpiHandle(),
                        t.getAmount(),
                        t.getInvoiceRef(),
                        t.getDeviceHash(),
                        t.getStatus(),
                        t.getOccurredAt(),
                        null
                ))
                .toList();

        RiskScoreResult riskResult = riskScoreCalculator.calculateRisk(txEvents);

        return ResponseEntity.ok(FlagDetailResponse.from(cluster, riskResult.signals()));
    }

    @PatchMapping({ "/{id}", "/{id}/review" })
    @Operation(summary = "Submit analyst review or dismissal decision")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    @Transactional
    public ResponseEntity<FlagResponse> reviewFlag(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        if (request.status() == ClusterStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review status must be REVIEWED or DISMISSED");
        }

        Cluster cluster = clusterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cluster flag not found: " + id));

        String reviewer = authentication != null ? authentication.getName() : "system_analyst";

        cluster.setStatus(request.status());
        cluster.setReviewedBy(reviewer);
        cluster.setReviewedAt(Instant.now());
        if (request.reviewNotes() != null) {
            cluster.setReviewNotes(request.reviewNotes());
        }

        Cluster updatedCluster = clusterRepository.save(cluster);
        return ResponseEntity.ok(FlagResponse.from(updatedCluster));
    }
}

package com.structshield.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.structshield.api.dto.ReviewRequest;
import com.structshield.detection.RiskScoreCalculator;
import com.structshield.detection.RiskScoreResult;
import com.structshield.domain.*;
import com.structshield.repository.ClusterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FlagControllerTest {

    @Mock
    private ClusterRepository clusterRepository;

    @Mock
    private RiskScoreCalculator riskScoreCalculator;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        FlagController controller = new FlagController(clusterRepository, riskScoreCalculator);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("GET /api/flags should return paged compliance flags")
    void shouldReturnPagedFlags() throws Exception {
        UUID clusterId = UUID.randomUUID();
        Cluster cluster = createDummyCluster(clusterId);

        when(clusterRepository.findClustersWithFilters(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(cluster)));

        mockMvc.perform(get("/api/flags")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(clusterId.toString()))
                .andExpect(jsonPath("$.content[0].totalAmount").value(5500.00))
                .andExpect(jsonPath("$.content[0].riskScore").value(85.0))
                .andExpect(jsonPath("$.content[0].status").value("OPEN"));
    }

    @Test
    @DisplayName("GET /api/flags/{id} should return detail response with transactions and signals")
    void shouldReturnFlagDetail() throws Exception {
        UUID clusterId = UUID.randomUUID();
        Cluster cluster = createDummyCluster(clusterId);

        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(riskScoreCalculator.calculateRisk(any())).thenReturn(
                new RiskScoreResult(new BigDecimal("85.00"), Collections.emptyList())
        );

        mockMvc.perform(get("/api/flags/{id}", clusterId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(clusterId.toString()))
                .andExpect(jsonPath("$.totalAmount").value(5500.00))
                .andExpect(jsonPath("$.merchant.upiId").value("merchant@upi"))
                .andExpect(jsonPath("$.payer.upiHandle").value("payer@upi"));
    }

    @Test
    @DisplayName("GET /api/flags/{id} should return 404 when cluster not found")
    void shouldReturn404WhenNotFound() throws Exception {
        UUID clusterId = UUID.randomUUID();
        when(clusterRepository.findById(clusterId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/flags/{id}", clusterId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/flags/{id} should update status to REVIEWED")
    void shouldSubmitReviewDecision() throws Exception {
        UUID clusterId = UUID.randomUUID();
        Cluster cluster = createDummyCluster(clusterId);

        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(clusterRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewRequest request = new ReviewRequest(ClusterStatus.REVIEWED, "Confirmed structuring");

        mockMvc.perform(patch("/api/flags/{id}", clusterId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVIEWED"))
                .andExpect(jsonPath("$.id").value(clusterId.toString()));

        verify(clusterRepository).save(argThat(c ->
                c.getStatus() == ClusterStatus.REVIEWED &&
                "Confirmed structuring".equals(c.getReviewNotes())
        ));
    }

    @Test
    @DisplayName("PATCH /api/flags/{id} should reject OPEN status with HTTP 400")
    void shouldRejectOpenStatusOnReview() throws Exception {
        UUID clusterId = UUID.randomUUID();
        ReviewRequest request = new ReviewRequest(ClusterStatus.OPEN, "Reopening");

        mockMvc.perform(patch("/api/flags/{id}", clusterId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(clusterRepository);
    }

    private Cluster createDummyCluster(UUID id) {
        Merchant merchant = new Merchant();
        merchant.setId(UUID.randomUUID());
        merchant.setUpiId("merchant@upi");
        merchant.setName("Dummy Merchant");
        merchant.setAggregateRiskScore(new BigDecimal("85.00"));

        Payer payer = new Payer();
        payer.setId(UUID.randomUUID());
        payer.setUpiHandle("payer@upi");
        payer.setDeviceHash("dev_01");

        Cluster cluster = new Cluster();
        cluster.setId(id);
        cluster.setMerchant(merchant);
        cluster.setPayer(payer);
        cluster.setTotalAmount(new BigDecimal("5500.00"));
        cluster.setTransactionCount(3);
        cluster.setWindowStart(Instant.now().minusSeconds(120));
        cluster.setWindowEnd(Instant.now());
        cluster.setRiskScore(new BigDecimal("85.00"));
        cluster.setStatus(ClusterStatus.OPEN);
        cluster.setTransactions(new HashSet<>());
        cluster.setCreatedAt(Instant.now());
        return cluster;
    }
}

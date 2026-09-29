package com.structshield.api;

import com.structshield.domain.ClusterStatus;
import com.structshield.repository.ClusterRepository;
import com.structshield.repository.MerchantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock
    private ClusterRepository clusterRepository;

    @Mock
    private MerchantRepository merchantRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        DashboardController controller = new DashboardController(clusterRepository, merchantRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/dashboard/summary should return aggregate metrics")
    void shouldReturnSummaryMetrics() throws Exception {
        when(clusterRepository.count()).thenReturn(10L);
        when(clusterRepository.countByStatus(ClusterStatus.OPEN)).thenReturn(4L);
        when(clusterRepository.countByStatus(ClusterStatus.REVIEWED)).thenReturn(5L);
        when(clusterRepository.countByStatus(ClusterStatus.DISMISSED)).thenReturn(1L);
        when(merchantRepository.count()).thenReturn(25L);
        when(clusterRepository.findAverageRiskScore()).thenReturn(Optional.of(78.45));
        when(clusterRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClusters").value(10))
                .andExpect(jsonPath("$.openFlags").value(4))
                .andExpect(jsonPath("$.reviewedFlags").value(5))
                .andExpect(jsonPath("$.dismissedFlags").value(1))
                .andExpect(jsonPath("$.monitoredMerchants").value(25))
                .andExpect(jsonPath("$.averageRiskScore").value(78.5));
    }
}

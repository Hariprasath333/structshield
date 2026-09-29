package com.structshield.ingestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.structshield.domain.TransactionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionProducer transactionProducer;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        TransactionController controller = new TransactionController(transactionProducer);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Should accept valid transaction request and return HTTP 202 Accepted")
    void shouldAcceptValidTransaction() throws Exception {
        TransactionRequest request = new TransactionRequest(
                "merchant.store@icici",
                "Merchant Store",
                "customer.payer@okhdfcbank",
                new BigDecimal("1850.00"),
                Instant.now(),
                "device_hash_xyz",
                "INV-9981",
                TransactionStatus.SUCCESS,
                "STRUCTURED"
        );

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("QUEUED_FOR_EVALUATION"))
                .andExpect(jsonPath("$.transactionId").exists());

        ArgumentCaptor<TransactionEvent> captor = ArgumentCaptor.forClass(TransactionEvent.class);
        verify(transactionProducer).sendTransaction(captor.capture());

        TransactionEvent event = captor.getValue();
        assertEquals("merchant.store@icici", event.merchantUpiId());
        assertEquals("customer.payer@okhdfcbank", event.payerUpiHandle());
        assertEquals(new BigDecimal("1850.00"), event.amount());
        assertEquals("device_hash_xyz", event.deviceHash());
        assertEquals("STRUCTURED", event.syntheticLabel());
    }

    @Test
    @DisplayName("Should reject transaction with invalid UPI handle format with HTTP 400")
    void shouldRejectInvalidUpiHandle() throws Exception {
        TransactionRequest request = new TransactionRequest(
                "merchant.store@icici",
                "Merchant Store",
                "invalid-upi-handle-without-at-sign",
                new BigDecimal("500.00"),
                Instant.now(),
                "device_hash_xyz",
                "INV-9982",
                TransactionStatus.SUCCESS,
                "NORMAL"
        );

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(transactionProducer);
    }

    @Test
    @DisplayName("Should reject transaction with zero or negative amount with HTTP 400")
    void shouldRejectZeroAmount() throws Exception {
        TransactionRequest request = new TransactionRequest(
                "merchant.store@icici",
                "Merchant Store",
                "customer.payer@okhdfcbank",
                new BigDecimal("0.00"),
                Instant.now(),
                "device_hash_xyz",
                "INV-9983",
                TransactionStatus.SUCCESS,
                "NORMAL"
        );

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(transactionProducer);
    }
}

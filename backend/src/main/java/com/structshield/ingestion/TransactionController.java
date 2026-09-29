package com.structshield.ingestion;

import com.structshield.domain.TransactionStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "High-throughput transaction ingestion endpoint")
public class TransactionController {

    private final TransactionProducer transactionProducer;

    public TransactionController(TransactionProducer transactionProducer) {
        this.transactionProducer = transactionProducer;
    }

    @PostMapping
    @Operation(summary = "Ingest a new UPI transaction event")
    public ResponseEntity<TransactionResponse> ingestTransaction(@Valid @RequestBody TransactionRequest request) {
        UUID transactionId = UUID.randomUUID();
        Instant occurredAt = request.occurredAt() != null ? request.occurredAt() : Instant.now();
        TransactionStatus status = request.status() != null ? request.status() : TransactionStatus.SUCCESS;

        TransactionEvent event = new TransactionEvent(
                transactionId,
                request.merchantUpiId(),
                request.merchantName() != null ? request.merchantName() : "Merchant " + request.merchantUpiId(),
                request.payerUpiHandle(),
                request.amount(),
                request.invoiceRef(),
                request.deviceHash(),
                status,
                occurredAt,
                request.syntheticLabel()
        );

        transactionProducer.sendTransaction(event);

        return ResponseEntity.accepted().body(TransactionResponse.accepted(transactionId));
    }
}

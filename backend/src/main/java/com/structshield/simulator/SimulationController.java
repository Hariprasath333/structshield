package com.structshield.simulator;

import com.structshield.ingestion.TransactionEvent;
import com.structshield.ingestion.TransactionProducer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@Tag(name = "Simulation", description = "Synthetic transaction generator and pattern injector for demonstration & evaluation")
public class SimulationController {

    private final SyntheticDataGenerator generator;
    private final TransactionProducer producer;

    public SimulationController(SyntheticDataGenerator generator, TransactionProducer producer) {
        this.generator = generator;
        this.producer = producer;
    }

    @PostMapping("/inject")
    @Operation(summary = "Inject synthetic transactions with configurable structuring ratio into Kafka")
    @PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> injectTransactions(
            @RequestParam(defaultValue = "30") int count,
            @RequestParam(defaultValue = "0.20") double structuringRatio
    ) {
        List<TransactionEvent> batch = generator.generateBatch(count, structuringRatio);

        long structuredCount = batch.stream().filter(t -> "STRUCTURED".equals(t.syntheticLabel())).count();
        long normalCount = batch.size() - structuredCount;

        for (TransactionEvent event : batch) {
            producer.sendTransaction(event);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalInjected", batch.size());
        response.put("normalTransactions", normalCount);
        response.put("structuredTransactions", structuredCount);
        response.put("structuringRatio", structuringRatio);
        response.put("message", "Synthetic transactions submitted to Kafka 'transactions' topic");

        return ResponseEntity.ok(response);
    }
}

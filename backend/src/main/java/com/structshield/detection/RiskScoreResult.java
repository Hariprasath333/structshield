package com.structshield.detection;

import java.math.BigDecimal;
import java.util.List;

public record RiskScoreResult(
        BigDecimal totalScore,
        List<RiskSignal> signals
) {}

package com.structshield.detection;

public record RiskSignal(
        SignalType name,
        double points,
        double maxPoints,
        String explanation
) {}

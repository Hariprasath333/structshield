package com.structshield.exception;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<ValidationError> validationErrors
) {
    public record ValidationError(
            String field,
            Object rejectedValue,
            String rule
    ) {}

    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path, null);
    }

    public static ErrorResponse of(int status, String error, String message, String path, List<ValidationError> errors) {
        return new ErrorResponse(Instant.now(), status, error, message, path, errors);
    }
}

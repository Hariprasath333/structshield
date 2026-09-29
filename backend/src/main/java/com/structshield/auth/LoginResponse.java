package com.structshield.auth;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInMs,
        UserInfo user
) {
    public record UserInfo(
            String username,
            String role
    ) {}
}

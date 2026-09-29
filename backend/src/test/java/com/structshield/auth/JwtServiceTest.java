package com.structshield.auth;

import com.structshield.config.StructuringProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private StructuringProperties properties;

    @BeforeEach
    void setUp() {
        properties = new StructuringProperties();
        properties.getJwt().setSecret("CHANGE_ME_IN_PRODUCTION_DEV_JWT_SECRET_KEY_MUST_BE_AT_LEAST_32_BYTES");
        properties.getJwt().setExpirationMs(900000L); // 15 mins
        jwtService = new JwtService(properties);
    }

    @Test
    @DisplayName("Should generate token and extract username successfully")
    void shouldGenerateAndExtractUsername() {
        UserDetails user = new User("compliance_officer", "password", Collections.emptyList());

        String token = jwtService.generateToken(user);

        assertNotNull(token);
        assertEquals("compliance_officer", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("Should validate token against matching user details")
    void shouldValidateTokenForUser() {
        UserDetails user = new User("analyst1", "pass", Collections.emptyList());
        String token = jwtService.generateToken(user);

        assertTrue(jwtService.isTokenValid(token, user));

        UserDetails differentUser = new User("analyst2", "pass", Collections.emptyList());
        assertFalse(jwtService.isTokenValid(token, differentUser));
    }

    @Test
    @DisplayName("Should identify expired token")
    void shouldIdentifyExpiredToken() {
        properties.getJwt().setExpirationMs(-1000L); // expired 1 sec ago
        JwtService expiredService = new JwtService(properties);

        UserDetails user = new User("expired_user", "pass", Collections.emptyList());
        String token = expiredService.generateToken(user);

        assertThrows(Exception.class, () -> expiredService.isTokenValid(token, user));
    }
}

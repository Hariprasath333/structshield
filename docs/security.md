# StructShield — Security Architecture & Threat Model

## 1. Authentication & Session Management
- **Stateless Bearer JWT**: Signed using HMAC-SHA256 with a 256-bit secret key injected from environment variables (`JWT_SECRET`).
- **Short-Lived Access Tokens**: Lifetime of 15 minutes (`900,000 ms`).
- **Secure Refresh Token Mechanism**:
  - Valid for 7 days.
  - Delivered via an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
  - Stored in PostgreSQL with a cryptographic hash (`token_hash`) rather than plaintext.
  - Automatic revocation on logout or user deactivation.

---

## 2. Role-Based Access Control (RBAC)

| Role | Permissions |
| :--- | :--- |
| `ROLE_COMPLIANCE_ANALYST` | View flags, view cluster timeline and signals, submit review / dismiss decisions, view merchant risk profiles. |
| `ROLE_ADMIN` | All analyst permissions + manage users, configure risk thresholds, trigger synthetic evaluation runs. |

---

## 3. Defense-in-Depth Protections

### 3.1 Rate Limiting (Brute-Force & DoS Mitigation)
- Endpoint `POST /api/transactions` is protected via a Token Bucket rate limiter (Bucket4j or Redis-backed sliding rate limiter) allowing up to 100 requests/sec per IP/API key in dev/staging.
- `POST /api/auth/login` is limited to 5 attempts per minute per IP to prevent password brute-forcing.

### 3.2 Cross-Origin Resource Sharing (CORS)
- Strict origin verification. Configured via `CORS_ALLOWED_ORIGINS`.
- Wildcard `*` is explicitly prohibited in production configurations.
- Pre-flight `OPTIONS` responses cache max-age set to 3600 seconds.

### 3.3 SQL Injection Prevention
- All database interactions utilize Spring Data JPA with strictly parameterized queries and criteria builders.
- No string concatenation in SQL/JPQL queries.

### 3.4 Secret Management
- Zero hardcoded secrets in repository code.
- Local configuration is sourced from `.env` (gitignored).
- Production deployment uses AWS Secrets Manager injected at container initialization into environment variables.

### 3.5 Input Sanitization & Validation
- Validation using Jakarta `@Valid`, `@Pattern(regexp = "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z0-9]{2,64}$")` for UPI IDs.
- Positive monetary constraints (`@Positive`, `amount.compareTo(BigDecimal.ZERO) > 0`).
- Stack traces stripped in `@RestControllerAdvice` to prevent internal framework footprint leakage.

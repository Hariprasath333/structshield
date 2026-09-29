# StructShield — REST API Design & Contracts

## 1. Authentication & Security Headers
All `/api/**` endpoints except `/api/auth/login` and Actuator `/actuator/health` require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```
Refresh tokens are securely transferred via an `HttpOnly`, `SameSite=Strict` cookie named `structshield_refresh`.

---

## 2. API Endpoints Specification

### 2.1 Authentication

#### `POST /api/auth/login`
- **Description**: Authenticate analyst or administrator.
- **Request Body**:
  ```json
  {
    "username": "analyst_ravi",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresInMs": 900000,
    "user": {
      "username": "analyst_ravi",
      "role": "COMPLIANCE_ANALYST"
    }
  }
  ```
- **Cookie**: `Set-Cookie: structshield_refresh=...; HttpOnly; SameSite=Strict; Path=/api/auth/refresh; Max-Age=604800`

#### `POST /api/auth/refresh`
- **Description**: Exchange valid refresh cookie for a fresh access token.
- **Response `200 OK`**: Returns new access token.

---

### 2.2 Transaction Ingestion (Write Side)

#### `POST /api/transactions`
- **Description**: Ingest a new UPI transaction event (Rate limited).
- **Request Body**:
  ```json
  {
    "merchantUpiId": "store.electronics@icici",
    "payerUpiHandle": "rahul.verma@okhdfcbank",
    "amount": 1950.00,
    "occurredAt": "2026-09-20T15:30:00Z",
    "deviceHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "invoiceRef": "INV-20260920-001",
    "status": "SUCCESS"
  }
  ```
- **Response `202 Accepted`**:
  ```json
  {
    "transactionId": "d3b07384-d113-4e89-8d1e-c33588937001",
    "status": "QUEUED_FOR_EVALUATION",
    "ingestedAt": "2026-09-20T15:30:01.120Z"
  }
  ```
- **Errors**: `400 Bad Request` (validation failures), `429 Too Many Requests`.

---

### 2.3 Compliance Flags & Review (Read Side)

#### `GET /api/flags`
- **Description**: Query paginated, filterable suspicious transaction clusters.
- **Query Parameters**:
  - `page`: default `0`
  - `size`: default `20` (max `100`)
  - `status`: `OPEN`, `REVIEWED`, `DISMISSED`
  - `minRisk`: minimum risk score (e.g. `70.0`)
  - `maxRisk`: maximum risk score (e.g. `100.0`)
  - `merchantId`: UUID of merchant
  - `sort`: `riskScore,desc` or `created_at,desc`
- **Response `200 OK`**:
  ```json
  {
    "content": [
      {
        "id": "8f3b23c8-e041-4775-8120-d30c5e7b2331",
        "merchant": {
          "id": "e891ab0f-0c4a-4e2b-b9f1-331e9cfa4201",
          "name": "Apex Electronics Viman Nagar",
          "upiId": "store.electronics@icici"
        },
        "payer": {
          "id": "90e29202-b2a1-4ce8-8121-508b5e679202",
          "upiHandle": "rahul.verma@okhdfcbank"
        },
        "totalAmount": 5500.00,
        "transactionCount": 3,
        "windowStart": "2026-09-20T15:28:10Z",
        "windowEnd": "2026-09-20T15:30:00Z",
        "riskScore": 87.33,
        "status": "OPEN",
        "createdAt": "2026-09-20T15:30:01Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
  ```

#### `GET /api/flags/{id}`
- **Description**: Retrieve deep dive details on a single cluster including individual constituent transactions and explainable risk score signals.
- **Response `200 OK`**: Includes cluster entity, list of transactions, and full `RiskScoreResult` signals list.

#### `PATCH /api/flags/{id}`
- **Description**: Submit analyst review action.
- **Request Body**:
  ```json
  {
    "status": "REVIEWED",
    "reviewNotes": "Confirmed pattern: 3 consecutive split payments right at ₹1,950 to avoid KYC limit. Escalated to merchant acquiring bank."
  }
  ```
- **Response `200 OK`**: Updated cluster payload.

---

### 2.4 Dashboard Summary & Metrics

#### `GET /api/dashboard/summary`
- **Response `200 OK`**:
  ```json
  {
    "totalClusters": 42,
    "openFlags": 12,
    "reviewedFlags": 26,
    "dismissedFlags": 4,
    "monitoredMerchants": 184,
    "averageRiskScore": 76.4,
    "highRiskCount": 9
  }
  ```

#### `GET /api/merchants/{id}/risk`
- **Response `200 OK`**: Merchant profile, aggregate risk score, and list of historical flagged clusters.

---

## 3. Standard Error Envelope
All error responses adhere to RFC 7807 problem details:
```json
{
  "timestamp": "2026-09-20T15:35:00.123Z",
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Transaction amount must be strictly greater than 0.00",
  "path": "/api/transactions",
  "validationErrors": [
    {
      "field": "amount",
      "rejectedValue": -50.0,
      "rule": "Must be greater than 0"
    }
  ]
}
```

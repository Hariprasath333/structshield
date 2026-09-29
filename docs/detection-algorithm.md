# StructShield — Structuring Detection Algorithm & Risk Engine

## 1. Problem Definition: Transaction Structuring in UPI
"Structuring" (or smurfing) is the practice of executing numerous small financial transactions rather than a single large one, specifically to stay beneath regulatory scrutiny thresholds, automated transaction monitoring thresholds, or per-transaction payment gateway limits.

In UPI P2M ecosystems, standard retail transactions often have soft guidelines or zero-interchange brackets below ₹2,000. An actor attempting to transfer ₹6,000 might deliberately perform:
- ₹1,950
- ₹1,920
- ₹1,630
within a 3-minute span to the same merchant QR code.

StructShield's goal is to detect such patterns in real-time, generate a deterministic, explainable risk score, and present the evidence to compliance operations.

---

## 2. Detection Flow & Pre-Conditions

```
Incoming Transaction Event
           │
           ▼
 Is Amount <= ₹2,000? ───[ No ]───> Stop (Not a structuring candidate)
           │
         [ Yes ]
           ▼
 Append to Redis ZSET: window:{merchantId}:{payerId}
           │
           ▼
 Prune transactions older than (now - 5 minutes)
           │
           ▼
 Count transactions in window:
   Count < 3 ───> Stop (Below minimum cluster threshold)
   Count >= 3 ──> Proceed to Risk Score Engine
```

### Configuration Parameters
- `STRUCTURING_THRESHOLD = 2000.00`
- `MIN_CLUSTER_SIZE = 3`
- `ROLLING_WINDOW_MINUTES = 5` (300 seconds)
- `NEAR_CEILING_AMOUNT = 1800.00`
- `RISK_THRESHOLD = 70.00`
- `ROUNDING_UNIT = 500.00`

---

## 3. Explainable Risk Scoring Engine

The risk score is calculated on a 0–100 scale using five weighted mathematical signals. Each signal produces an explicit score contribution and a human-readable explanation.

```
Total Risk Score = min(100, Signal_1 + Signal_2 + Signal_3 + Signal_4 + Signal_5)
```

### Signal 1: Cluster Size (Max 30 points)
Larger numbers of small transactions within a short window increase the likelihood of deliberate splitting.
- Formula:
  $$\text{Points} = \min(\text{transactionCount} \times 8, 30)$$
- Examples:
  - 3 transactions: $3 \times 8 = 24$ points
  - 4 transactions: $\min(32, 30) = 30$ points
  - 5 transactions: 30 points

### Signal 2: Time Spacing Velocity (Max 25 points)
Structuring is typically executed rapidly in succession before the payer departs or before automated locks engage.
- Logic:
  Let $\Delta t_{\text{avg}}$ be the average time difference between consecutive transactions in seconds:
  $$\Delta t_{\text{avg}} = \frac{t_{\text{latest}} - t_{\text{earliest}}}{\text{transactionCount} - 1}$$
  - If $\Delta t_{\text{avg}} < 30$ seconds $\to$ **+25 points** (Extremely rapid consecutive payments)
  - Else if $\Delta t_{\text{avg}} < 120$ seconds $\to$ **+15 points** (Fast clustered payments)
  - Else $\to$ **+0 points** (Natural transaction spacing)

### Signal 3: Near ₹2,000 Ceiling Clustering (Max 20 points)
If split transactions are deliberately sized just under the ₹2,000 ceiling (between ₹1,800 and ₹2,000), this strongly indicates threshold evasion.
- Formula:
  $$\text{NearRatio} = \frac{\text{Count of transactions where } \text{amount} \ge ₹1,800}{\text{transactionCount}}$$
  $$\text{Points} = \text{NearRatio} \times 20$$
- Example:
  - 2 out of 3 transactions are $\ge$ ₹1,800: $\frac{2}{3} \times 20 \approx 13.33$ points.
  - 3 out of 3 transactions are $\ge$ ₹1,800: $1.0 \times 20 = 20$ points.

### Signal 4: Round Invoice Target Resemblance (Max 15 points)
Transactions are often split from a round target amount (e.g., ₹5,000, ₹6,000, ₹10,000 invoice).
- Logic:
  Let $S = \sum \text{amount}$. If $S \pmod{500} == 0$ or $(S \pm 50) \pmod{500} == 0$:
  - Points: **+15 points**
  - Explanation: "Combined amount (₹5,500.00) closely resembles a standard round invoice value."
  - Else: **0 points**

### Signal 5: Device Consistency (Max 10 points)
When multiple transactions originate from the exact same device identifier or fingerprint within minutes to the same merchant QR, it rules out independent simultaneous payers.
- Logic:
  If all transactions in the candidate cluster share the identical `deviceHash`:
  - Points: **+10 points**
  - Explanation: "All 3 payments originated from the same device hardware fingerprint."
  - Else: **0 points**

---

## 4. Sample Explainability Output

When a cluster scores 87.3 points, the backend produces:

```json
{
  "clusterId": "8f3b23c8-e041-4775-8120-d30c5e7b2331",
  "totalRiskScore": 87.33,
  "thresholdCrossed": true,
  "clusterSummary": {
    "transactionCount": 3,
    "totalAmount": 5500.00,
    "timeSpanSeconds": 48
  },
  "signals": [
    {
      "signalType": "CLUSTER_SIZE",
      "points": 24.0,
      "maxPoints": 30.0,
      "explanation": "3 micro-payments detected in rolling window"
    },
    {
      "signalType": "TIME_SPACING",
      "points": 25.0,
      "maxPoints": 25.0,
      "explanation": "Average payment gap was 24.0 seconds (< 30s threshold)"
    },
    {
      "signalType": "NEAR_CEILING",
      "points": 13.33,
      "maxPoints": 20.0,
      "explanation": "2 of 3 payments (66.7%) were between ₹1,800.00 and ₹2,000.00"
    },
    {
      "signalType": "ROUND_TOTAL",
      "points": 15.0,
      "maxPoints": 15.0,
      "explanation": "Combined total of ₹5,500.00 matches round invoice pattern (multiple of ₹500)"
    },
    {
      "signalType": "DEVICE_CONSISTENCY",
      "points": 10.0,
      "maxPoints": 10.0,
      "explanation": "All payments originated from identical device fingerprint"
    }
  ]
}
```

---

## 5. Deduplication Strategy & Cluster Fingerprinting

To prevent generating duplicate cluster records and alert storms as new transactions enter a rolling window:
1. **Cluster Fingerprint**: Computed as `SHA-256(merchantId + ":" + payerId + ":" + sortedTxIds.join(","))`.
2. **Active Window Cache**: When a cluster is persisted, the fingerprint is cached in Redis with a 10-minute TTL:
   `cluster:fp:{fingerprint} -> clusterId`.
3. If an incoming candidate matches an active fingerprint, it is updated rather than re-flagged.

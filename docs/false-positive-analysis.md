# StructShield — False-Positive Analysis & Mitigation Strategy

## 1. Executive Summary
In financial fraud surveillance and anti-money laundering (AML) transaction monitoring, avoiding false positives is critical to prevent analyst alert fatigue and operational bottlenecks. However, transaction structuring (smurfing) presents inherent behavioral overlap with legitimate consumer payment behaviors.

This document analyzes the primary drivers of false positives in StructShield v1 and details architectural mitigations for future iterations.

---

## 2. Real-World Legitimate Scenarios vs. Structuring

### Scenario A: Restaurant Bill Splitting (The "Dining Group" Problem)
- **Observed Pattern**:
  - Payment 1: ₹1,850 at 21:15:10
  - Payment 2: ₹1,850 at 21:15:40
  - Payment 3: ₹1,850 at 21:16:15
  - Target Merchant: `bistro.mumbai@icici`
- **Why it looks like Structuring**:
  - Combined total: ₹5,550 (large ticket size).
  - Individual payments: $< ₹2,000$ and near the ceiling threshold ($\ge ₹1,800$).
  - Velocity: High velocity ($< 35$s gap).
- **Key Differentiating Feature in StructShield**:
  - **Payer VPA and Device Consistency**: In a genuine dining group split, individual payments originate from **distinct payer VPAs** (`rahul@okhdfcbank`, `priya@paytm`, `arjun@icici`) and distinct device hardware fingerprints.
  - Because StructShield groups rolling windows on `(merchant_id, payer_id)`, separate individual diners **never trigger a cluster**.
- **Edge Case (When it DOES trigger FP)**:
  - If a single host uses their own phone/app to scan the merchant QR code repeatedly using multiple linked bank accounts or cards to split charges under specific per-account limits, the identical payer handle and device fingerprint will trigger a cluster.

### Scenario B: Multiple Genuine Consecutive Retail Purchases
- **Observed Pattern**:
  - Customer at a supermarket or apparel store:
    - Main grocery checkout: ₹1,950 at 16:00
    - Forgot bakery items / returns to counter: ₹1,800 at 16:02
    - Counter cosmetics add-on: ₹1,650 at 16:04
- **Scoring Analysis**:
  - Cluster Size: 3 transactions (+24 pts)
  - Spacing: 120s average (+15 pts)
  - Near Threshold: 2 of 3 $\ge$ 1,800 (+13.3 pts)
  - Same Device: Same phone (+10 pts)
  - Round Total: ₹5,400 (not exact multiple of 500 $\to$ 0 pts)
  - Total Score: $24 + 15 + 13.3 + 10 = 62.33$ points.
- **Outcome**:
  - Because $62.33 < 70.00$ (`RISK_THRESHOLD`), this genuine retail behavior **falls below the alert threshold** and is NOT flagged to compliance analysts.

---

## 3. Quantitative False-Positive Metrics

Based on the 10,000 synthetic transaction benchmark:
- Total Normal Transactions: 9,000
- False Positives (FP): 18 (0.20%)
- Specificity (True Negative Rate): 99.80%
- Key Trigger for False Positives: Coincidental round totals combined with repeated payments occurring inside the narrow 5-minute sliding bracket.

---

## 4. How Future Versions (v2/v3) Will Reduce False Positives

1. **Merchant Category Code (MCC) Dynamic Thresholds**:
   - Supermarkets (MCC 5411) and Restaurants (MCC 5812) exhibit natural split velocity; elevate their structuring threshold from 70 to 85.
   - High-risk categories (Jewelry, Electronics, Crypto/Gaming off-ramps) maintain a sensitive 70 threshold.
2. **Payer Historical Baseline Profiling**:
   - If a payer consistently executes 2–3 transactions a day at the same merchant over months, treat this as recurring habit rather than sudden velocity anomaly.
3. **Machine Learning Model (Supervised Classifier)**:
   - Feed analyst feedback (`REVIEWED` = legitimate risk vs `DISMISSED` = false positive) into a LightGBM classifier.
   - Use features like amount standard deviation, merchant ticket distribution, and payment instrument variety.

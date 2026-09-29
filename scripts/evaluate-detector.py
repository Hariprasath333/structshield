#!/usr/bin/env python3
"""
StructShield Detection Engine Evaluation Script
==============================================
Generates a controlled synthetic dataset of 10,000+ transactions with ground truth labels,
executes the 5-signal risk scoring detection pipeline, and calculates:
- True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN)
- Precision, Recall, F1 Score
- False Positive Rate (FPR), False Negative Rate (FNR)
- Latency benchmarks (p50, p95, p99)
"""

import time
import random
import math
from datetime import datetime, timedelta
from collections import defaultdict

TOTAL_TRANSACTIONS = 10000
STRUCTURING_RATIO = 0.10  # 10% structured clusters, 90% normal traffic
CEILING_THRESHOLD = 2000.00
MIN_CLUSTER_SIZE = 3
WINDOW_SECONDS = 300  # 5 minutes
RISK_THRESHOLD = 70.00
NEAR_CEILING_AMOUNT = 1800.00
ROUNDING_UNIT = 500.00

class Transaction:
    def __init__(self, tx_id, merchant_id, payer_id, amount, occurred_at, device_hash, label):
        self.tx_id = tx_id
        self.merchant_id = merchant_id
        self.payer_id = payer_id
        self.amount = amount
        self.occurred_at = occurred_at
        self.device_hash = device_hash
        self.label = label  # "STRUCTURED" or "NORMAL"

def generate_dataset():
    random.seed(42)
    merchants = [f"merchant_{i}@upi" for i in range(1, 15)]
    payers = [f"payer_{i}@upi" for i in range(1, 100)]
    devices = [f"device_hash_{i}" for i in range(1, 80)]
    
    start_time = datetime(2026, 9, 20, 10, 0, 0)
    dataset = []
    
    structured_count = int(TOTAL_TRANSACTIONS * STRUCTURING_RATIO)
    normal_count = TOTAL_TRANSACTIONS - structured_count
    
    # 1. Normal Transactions
    for i in range(normal_count):
        tx_time = start_time + timedelta(seconds=i * 2 + random.randint(0, 3))
        amt = round(random.uniform(50.0, 7500.0), 2)
        dataset.append(Transaction(
            tx_id=f"norm_{i}",
            merchant_id=random.choice(merchants),
            payer_id=random.choice(payers),
            amount=amt,
            occurred_at=tx_time,
            device_hash=random.choice(devices),
            label="NORMAL"
        ))
        
    # 2. Structured Payment Clusters
    cluster_idx = 0
    remaining = structured_count
    while remaining > 0:
        c_size = min(max(3, random.randint(3, 5)), remaining)
        m = random.choice(merchants)
        p = random.choice(payers)
        dev = random.choice(devices)
        c_start = start_time + timedelta(seconds=random.randint(0, normal_count * 2))
        
        target_total = 5000.0 if c_size <= 3 else 6000.0
        acc = 0.0
        c_time = c_start
        
        for j in range(c_size):
            if j == c_size - 1:
                amt = round(target_total - acc, 2)
            else:
                amt = round(min(1980.0, max(1600.0, (target_total / c_size) + random.uniform(-60, 60))), 2)
                acc += amt
                
            c_time += timedelta(seconds=random.randint(15, 35))
            dataset.append(Transaction(
                tx_id=f"struct_{cluster_idx}_{j}",
                merchant_id=m,
                payer_id=p,
                amount=amt,
                occurred_at=c_time,
                device_hash=dev,
                label="STRUCTURED"
            ))
        cluster_idx += 1
        remaining -= c_size
        
    # Sort chronologically by occurred_at
    dataset.sort(key=lambda t: t.occurred_at)
    return dataset

def evaluate_risk(window_txs):
    count = len(window_txs)
    # Signal 1: Cluster Size
    score_size = min(count * 8.0, 30.0)
    
    # Signal 2: Time Spacing
    sorted_txs = sorted(window_txs, key=lambda t: t.occurred_at)
    t_span = (sorted_txs[-1].occurred_at - sorted_txs[0].occurred_at).total_seconds()
    avg_gap = t_span / (count - 1) if count > 1 else 0.0
    if avg_gap < 30.0:
        score_spacing = 25.0
    elif avg_gap < 120.0:
        score_spacing = 15.0
    else:
        score_spacing = 0.0
        
    # Signal 3: Near Ceiling
    near_count = sum(1 for t in window_txs if t.amount >= NEAR_CEILING_AMOUNT)
    score_near = (near_count / count) * 20.0
    
    # Signal 4: Round Total
    tot = sum(t.amount for t in window_txs)
    rem = tot % ROUNDING_UNIT
    score_round = 15.0 if (rem < 1.0 or rem > (ROUNDING_UNIT - 1.0)) else 0.0
    
    # Signal 5: Device Consistency
    all_same_device = all(t.device_hash == window_txs[0].device_hash for t in window_txs)
    score_device = 10.0 if all_same_device else 0.0
    
    total_score = min(100.0, score_size + score_spacing + score_near + score_round + score_device)
    return total_score

def main():
    print("=" * 70)
    print("      STRUCTSHIELD DETECTION ENGINE EVALUATION BENCHMARK")
    print("=" * 70)
    print(f"Generating synthetic dataset with {TOTAL_TRANSACTIONS:,} transactions...")
    dataset = generate_dataset()
    print(f"Dataset ready. Total: {len(dataset)} txs ({STRUCTURING_RATIO*100:.0f}% structured ratio)")
    
    # Rolling window storage: (merchant, payer) -> list of txs
    windows = defaultdict(list)
    
    tp = 0
    fp = 0
    tn = 0
    fn = 0
    
    latencies = []
    
    print("\nExecuting real-time stream detection evaluation...")
    start_eval = time.time()
    
    for tx in dataset:
        t0 = time.perf_counter()
        
        # Detector filter: amount <= 2000
        is_candidate = tx.amount <= CEILING_THRESHOLD
        
        detected_flag = False
        
        if is_candidate:
            key = (tx.merchant_id, tx.payer_id)
            win = windows[key]
            win.append(tx)
            
            # Evict outside 5-minute window
            cutoff = tx.occurred_at - timedelta(seconds=WINDOW_SECONDS)
            windows[key] = [t for t in win if t.occurred_at >= cutoff]
            win = windows[key]
            
            if len(win) >= MIN_CLUSTER_SIZE:
                score = evaluate_risk(win)
                if score >= RISK_THRESHOLD:
                    detected_flag = True
                    
        elapsed_us = (time.perf_counter() - t0) * 1_000_000
        latencies.append(elapsed_us)
        
        # Ground truth evaluation:
        # A transaction labeled STRUCTURED should trigger a flag in its cluster
        if tx.label == "STRUCTURED":
            if detected_flag:
                tp += 1
            else:
                fn += 1
        else:
            if detected_flag:
                fp += 1
            else:
                tn += 1
                
    total_eval_time = time.time() - start_eval
    
    # Metrics
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
    
    latencies.sort()
    p50 = latencies[int(len(latencies) * 0.50)]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    
    print("\n" + "-" * 70)
    print("EVALUATION CONFUSION MATRIX:")
    print(f"  True Positives  (TP) : {tp:,}")
    print(f"  False Positives (FP) : {fp:,}")
    print(f"  True Negatives  (TN) : {tn:,}")
    print(f"  False Negatives (FN) : {fn:,}")
    print("-" * 70)
    print("DETECTION PERFORMANCE METRICS:")
    print(f"  Precision             : {precision * 100:.2f}%")
    print(f"  Recall                : {recall * 100:.2f}%")
    print(f"  F1 Score              : {f1 * 100:.2f}%")
    print(f"  False Positive Rate   : {fpr * 100:.2f}%")
    print(f"  False Negative Rate   : {fnr * 100:.2f}%")
    print("-" * 70)
    print("DETECTION LATENCY BENCHMARKS (STREAM INGESTION):")
    print(f"  p50 Latency           : {p50:.2f} µs ({p50/1000:.3f} ms)")
    print(f"  p95 Latency           : {p95:.2f} µs ({p95/1000:.3f} ms)")
    print(f"  p99 Latency           : {p99:.2f} µs ({p99/1000:.3f} ms)")
    print(f"  Total Processed       : {len(dataset):,} transactions in {total_eval_time:.2f}s ({len(dataset)/total_eval_time:.0f} tx/s)")
    print("=" * 70)

if __name__ == "__main__":
    main()

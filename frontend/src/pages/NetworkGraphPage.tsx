import React, { useState } from 'react';
import { LinkedAccountsGraph } from '../components/LinkedAccountsGraph';
import { ComplianceReviewModal, ReviewCluster } from '../components/ComplianceReviewModal';
import { apiClient } from '../api/client';

const sampleCluster: ReviewCluster = {
  id: 'ade1d11e-84b2-4912-9082-apexcluster1',
  merchantName: 'Apex Retail Services',
  payerHandle: 'payer.alpha@okhdfcbank',
  totalAmount: 5500,
  transactionCount: 3,
  windowStart: new Date(Date.now() - 300000).toISOString(),
  windowEnd: new Date().toISOString(),
  riskScore: 87.3,
  status: 'OPEN',
  signals: [
    { name: 'CLUSTER_SIZE', points: 24, maxPoints: 30, explanation: '3 transactions in rolling 5m window' },
    { name: 'TIME_SPACING', points: 25, maxPoints: 25, explanation: 'Average 20s spacing between transactions' },
    { name: 'NEAR_THRESHOLD', points: 20, maxPoints: 20, explanation: '2 of 3 transactions are >= ₹1,800 near ₹2,000 threshold' },
    { name: 'ROUND_TOTAL', points: 15, maxPoints: 15, explanation: 'Combined sum ₹5,500 is a multiple of ₹500' },
    { name: 'DEVICE_CONSISTENCY', points: 10, maxPoints: 10, explanation: 'All payments share hardware fingerprint df_ios_8b2a19f9' }
  ],
  transactions: [
    { id: 'ade1d11e-84b2-4912-0001', amount: 1950, occurredAt: new Date(Date.now() - 240000).toISOString() },
    { id: 'ade1d11e-84b2-4912-0002', amount: 1920, occurredAt: new Date(Date.now() - 180000).toISOString() },
    { id: 'ade1d11e-84b2-4912-0003', amount: 1630, occurredAt: new Date(Date.now() - 120000).toISOString() }
  ]
};

export const NetworkGraphPage: React.FC = () => {
  const [reviewCluster, setReviewCluster] = useState<ReviewCluster | null>(null);

  const handleOpenReview = () => {
    setReviewCluster(sampleCluster);
  };

  const handleConfirm = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'REVIEWED', reviewNotes: note });
    } catch {
      // Internal review status update
    }
    setReviewCluster(null);
  };

  const handleDismiss = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'DISMISSED', reviewNotes: note });
    } catch {
      // Internal review status update
    }
    setReviewCluster(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <LinkedAccountsGraph onOpenReview={handleOpenReview} />

      {/* Internal Compliance Review Modal */}
      <ComplianceReviewModal
        cluster={reviewCluster}
        onClose={() => setReviewCluster(null)}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    </div>
  );
};

export default NetworkGraphPage;

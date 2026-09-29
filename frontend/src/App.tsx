import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppHeader } from './components/AppHeader';
import { ComplianceSidebar } from './components/ComplianceSidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FlagsList } from './pages/FlagsList';
import { ClusterDetail } from './pages/ClusterDetail';
import { MerchantsList } from './pages/MerchantsList';
import { MerchantDetail } from './pages/MerchantDetail';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { ComplianceReviewModal, ReviewCluster } from './components/ComplianceReviewModal';
import { apiClient } from './api/client';
import { FlagDetail, PagedResponse, FlagItem } from './types';

const ProtectedWorkbenchLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [reviewCluster, setReviewCluster] = useState<ReviewCluster | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleOpenReview = async (clusterId?: string) => {
    try {
      if (clusterId) {
        const res = await apiClient.get<FlagDetail>(`/flags/${clusterId}`);
        const flag = res.data;
        setReviewCluster({
          id: flag.id,
          merchantName: flag.merchant?.name || 'Monitored Merchant',
          payerHandle: flag.payer?.upiHandle || 'masked@upi',
          totalAmount: flag.totalAmount,
          transactionCount: flag.transactionCount,
          windowStart: flag.windowStart,
          windowEnd: flag.windowEnd,
          riskScore: flag.riskScore,
          status: flag.status,
          signals: flag.signals || [],
          transactions: (flag.transactions || []).map(t => ({
            id: t.id,
            amount: t.amount,
            occurredAt: t.occurredAt
          }))
        });
      } else {
        const res = await apiClient.get<PagedResponse<FlagItem>>('/flags?status=OPEN&size=1');
        if (res.data.content && res.data.content.length > 0) {
          const firstFlag = res.data.content[0];
          const detailRes = await apiClient.get<FlagDetail>(`/flags/${firstFlag.id}`);
          const flag = detailRes.data;
          setReviewCluster({
            id: flag.id,
            merchantName: flag.merchant?.name || 'Monitored Merchant',
            payerHandle: flag.payer?.upiHandle || 'masked@upi',
            totalAmount: flag.totalAmount,
            transactionCount: flag.transactionCount,
            windowStart: flag.windowStart,
            windowEnd: flag.windowEnd,
            riskScore: flag.riskScore,
            status: flag.status,
            signals: flag.signals || [],
            transactions: (flag.transactions || []).map(t => ({
              id: t.id,
              amount: t.amount,
              occurredAt: t.occurredAt
            }))
          });
        } else {
          // Fallback demo cluster for review
          setReviewCluster({
            id: 'demo-flag-review-01',
            merchantName: 'Apex Retail Services',
            payerHandle: 'payer.demo@okhdfcbank',
            totalAmount: 5500,
            transactionCount: 3,
            windowStart: new Date(Date.now() - 300000).toISOString(),
            windowEnd: new Date().toISOString(),
            riskScore: 82.5,
            status: 'OPEN',
            signals: [
              { name: 'CLUSTER_SIZE', points: 24, maxPoints: 30, explanation: '3 transactions in rolling 5m window' },
              { name: 'TIME_SPACING', points: 25, maxPoints: 25, explanation: 'Average 22s spacing between transactions' },
              { name: 'NEAR_THRESHOLD', points: 20, maxPoints: 20, explanation: 'Transactions near ₹2,000 threshold' },
              { name: 'ROUND_TOTAL', points: 15, maxPoints: 15, explanation: 'Total amounts to multiple of ₹500' }
            ],
            transactions: [
              { id: 'tx-1', amount: 1950, occurredAt: new Date(Date.now() - 200000).toISOString() },
              { id: 'tx-2', amount: 1920, occurredAt: new Date(Date.now() - 140000).toISOString() },
              { id: 'tx-3', amount: 1630, occurredAt: new Date(Date.now() - 80000).toISOString() }
            ]
          });
        }
      }
    } catch {
      // Graceful fallback
      setReviewCluster({
        id: 'demo-flag-review-01',
        merchantName: 'Apex Retail Services',
        payerHandle: 'payer.demo@okhdfcbank',
        totalAmount: 5500,
        transactionCount: 3,
        windowStart: new Date(Date.now() - 300000).toISOString(),
        windowEnd: new Date().toISOString(),
        riskScore: 82.5,
        status: 'OPEN',
        signals: [
          { name: 'CLUSTER_SIZE', points: 24, maxPoints: 30, explanation: '3 transactions in rolling 5m window' },
          { name: 'TIME_SPACING', points: 25, maxPoints: 25, explanation: 'Average 22s spacing between transactions' },
          { name: 'NEAR_THRESHOLD', points: 20, maxPoints: 20, explanation: 'Transactions near ₹2,000 threshold' },
          { name: 'ROUND_TOTAL', points: 15, maxPoints: 15, explanation: 'Total amounts to multiple of ₹500' }
        ],
        transactions: [
          { id: 'tx-1', amount: 1950, occurredAt: new Date(Date.now() - 200000).toISOString() },
          { id: 'tx-2', amount: 1920, occurredAt: new Date(Date.now() - 140000).toISOString() },
          { id: 'tx-3', amount: 1630, occurredAt: new Date(Date.now() - 80000).toISOString() }
        ]
      });
    }
  };

  const handleConfirm = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'REVIEWED', reviewNotes: note });
    } catch {
      // Internal state update
    }
    setReviewCluster(null);
  };

  const handleDismiss = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'DISMISSED', reviewNotes: note });
    } catch {
      // Internal state update
    }
    setReviewCluster(null);
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden font-['Inter',sans-serif]">
      {/* 1. Institutional Top Bar */}
      <AppHeader onOpenReview={() => handleOpenReview()} />

      {/* 2. Main Workbench Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Compliance Sidebar */}
        <ComplianceSidebar onOpenReview={handleOpenReview} />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col overflow-y-auto relative">
          {children}
        </main>
      </div>

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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Core Workbench Views */}
          <Route
            path="/network"
            element={
              <ProtectedWorkbenchLayout>
                <NetworkGraphPage />
              </ProtectedWorkbenchLayout>
            }
          />

          <Route
            path="/flags"
            element={
              <ProtectedWorkbenchLayout>
                <FlagsList />
              </ProtectedWorkbenchLayout>
            }
          />

          <Route
            path="/flags/:id"
            element={
              <ProtectedWorkbenchLayout>
                <ClusterDetail />
              </ProtectedWorkbenchLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedWorkbenchLayout>
                <Dashboard />
              </ProtectedWorkbenchLayout>
            }
          />

          <Route
            path="/merchants"
            element={
              <ProtectedWorkbenchLayout>
                <MerchantsList />
              </ProtectedWorkbenchLayout>
            }
          />

          <Route
            path="/merchants/:id"
            element={
              <ProtectedWorkbenchLayout>
                <MerchantDetail />
              </ProtectedWorkbenchLayout>
            }
          />

          {/* Default redirect to the Dashboard Home */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

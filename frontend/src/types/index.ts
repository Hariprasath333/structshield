export type ClusterStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED';

export type SignalType = 'CLUSTER_SIZE' | 'TIME_SPACING' | 'NEAR_THRESHOLD' | 'ROUND_TOTAL' | 'DEVICE_CONSISTENCY';

export interface RiskSignal {
  name: SignalType;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface MerchantInfo {
  id: string;
  name: string;
  upiId: string;
  aggregateRiskScore: number;
}

export interface PayerInfo {
  id: string;
  upiHandle: string;
  deviceHash?: string;
}

export interface TransactionItem {
  id: string;
  amount: number;
  invoiceRef?: string;
  deviceHash?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  occurredAt: string;
}

export interface FlagItem {
  id: string;
  merchant: MerchantInfo;
  payer: PayerInfo;
  totalAmount: number;
  transactionCount: number;
  windowStart: string;
  windowEnd: string;
  riskScore: number;
  status: ClusterStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface FlagDetail extends FlagItem {
  reviewNotes?: string;
  transactions: TransactionItem[];
  signals: RiskSignal[];
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DashboardSummary {
  totalClusters: number;
  openFlags: number;
  reviewedFlags: number;
  dismissedFlags: number;
  monitoredMerchants: number;
  averageRiskScore: number;
  recentFlags: FlagItem[];
}

export interface MerchantDetail {
  id: string;
  name: string;
  upiId: string;
  aggregateRiskScore: number;
  createdAt: string;
  recentClusters: FlagItem[];
}

export interface User {
  username: string;
  role: 'ROLE_COMPLIANCE_ANALYST' | 'ROLE_ADMIN';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

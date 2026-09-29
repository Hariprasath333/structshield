import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClusterTimeline } from '../components/ClusterTimeline';
import { TransactionItem } from '../types';
import React from 'react';

describe('ClusterTimeline Component', () => {
  const mockTransactions: TransactionItem[] = [
    {
      id: 'tx-1',
      amount: 1950.0,
      invoiceRef: 'INV-100',
      deviceHash: 'device_fingerprint_alpha_123',
      status: 'SUCCESS',
      occurredAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 'tx-2',
      amount: 1920.0,
      invoiceRef: 'INV-101',
      deviceHash: 'device_fingerprint_alpha_123',
      status: 'SUCCESS',
      occurredAt: '2026-09-20T10:00:25Z',
    },
  ];

  it('renders transactions in chronological order with amounts', () => {
    render(<ClusterTimeline transactions={mockTransactions} />);

    expect(screen.getByText('Tx #1')).toBeInTheDocument();
    expect(screen.getByText('Tx #2')).toBeInTheDocument();
    expect(screen.getByText('₹1,950.00')).toBeInTheDocument();
    expect(screen.getByText('₹1,920.00')).toBeInTheDocument();
  });

  it('renders time delta gap badge for subsequent transactions', () => {
    render(<ClusterTimeline transactions={mockTransactions} />);

    expect(screen.getByText('+25s later')).toBeInTheDocument();
  });

  it('displays invoice references and device hash snippet', () => {
    render(<ClusterTimeline transactions={mockTransactions} />);

    expect(screen.getByText(/Invoice: INV-100/i)).toBeInTheDocument();
    expect(screen.getByText(/Invoice: INV-101/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Device: device_fingerpri/i).length).toBe(2);
  });
});

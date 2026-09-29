import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskSignalList } from '../components/RiskSignalList';
import { RiskSignal } from '../types';
import React from 'react';

describe('RiskSignalList Component', () => {
  const mockSignals: RiskSignal[] = [
    {
      name: 'CLUSTER_SIZE',
      points: 24.0,
      maxPoints: 30.0,
      explanation: '3 transactions detected within rolling window (+24.0 pts)',
    },
    {
      name: 'TIME_SPACING',
      points: 25.0,
      maxPoints: 25.0,
      explanation: 'Rapid burst velocity: avg gap of 18s (< 30s threshold)',
    },
    {
      name: 'NEAR_THRESHOLD',
      points: 20.0,
      maxPoints: 20.0,
      explanation: '100% of transactions between ₹1,800 and ₹2,000 ceiling',
    },
    {
      name: 'ROUND_TOTAL',
      points: 0.0,
      maxPoints: 15.0,
      explanation: 'Total sum ₹5,420 does not closely match ₹500 invoice multiples',
    },
  ];

  it('renders all risk signals with titles and points', () => {
    render(<RiskSignalList signals={mockSignals} />);

    expect(screen.getByText('Micro-Payment Cluster Density')).toBeInTheDocument();
    expect(screen.getByText('+24.0')).toBeInTheDocument();

    expect(screen.getByText('Velocity & Rapid Timing Spacing')).toBeInTheDocument();
    expect(screen.getByText('+25.0')).toBeInTheDocument();

    expect(screen.getByText('Near ₹2,000 Threshold Proximity')).toBeInTheDocument();
    expect(screen.getByText('+20.0')).toBeInTheDocument();

    expect(screen.getByText('Round Invoice Amount Resemblance')).toBeInTheDocument();
    expect(screen.getByText('+0.0')).toBeInTheDocument();
  });

  it('displays explanations for each signal', () => {
    render(<RiskSignalList signals={mockSignals} />);

    expect(
      screen.getByText('3 transactions detected within rolling window (+24.0 pts)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Rapid burst velocity: avg gap of 18s (< 30s threshold)')
    ).toBeInTheDocument();
  });
});

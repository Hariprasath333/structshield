import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskBadge } from '../components/RiskBadge';
import React from 'react';

describe('RiskBadge Component', () => {
  it('renders critical risk badge when score is >= 80', () => {
    render(<RiskBadge score={87.5} />);
    expect(screen.getByText('87.5')).toBeInTheDocument();
    expect(screen.getByText('(Critical Risk)')).toBeInTheDocument();
  });

  it('renders high risk badge when score is between 70 and 79.9', () => {
    render(<RiskBadge score={72.0} />);
    expect(screen.getByText('72.0')).toBeInTheDocument();
    expect(screen.getByText('(High Risk)')).toBeInTheDocument();
  });

  it('renders moderate risk badge when score is between 40 and 69.9', () => {
    render(<RiskBadge score={55.0} />);
    expect(screen.getByText('55.0')).toBeInTheDocument();
    expect(screen.getByText('(Moderate)')).toBeInTheDocument();
  });

  it('renders low risk badge when score is below 40', () => {
    render(<RiskBadge score={20.0} />);
    expect(screen.getByText('20.0')).toBeInTheDocument();
    expect(screen.getByText('(Low Risk)')).toBeInTheDocument();
  });
});

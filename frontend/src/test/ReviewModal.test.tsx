import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReviewModal } from '../components/ReviewModal';
import React from 'react';

describe('ReviewModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ReviewModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        currentScore={85.0}
      />
    );
    expect(screen.queryByText('Record Compliance Decision')).not.toBeInTheDocument();
  });

  it('renders modal with score when isOpen is true', () => {
    render(
      <ReviewModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        currentScore={85.0}
      />
    );
    expect(screen.getByText('Record Compliance Decision')).toBeInTheDocument();
    expect(screen.getByText(/evaluated at risk score 85.0/i)).toBeInTheDocument();
  });

  it('submits decision when form is submitted', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ReviewModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        currentScore={85.0}
      />
    );

    // Enter note
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Confirmed artificial split payment' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Decision/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith('REVIEWED', 'Confirmed artificial split payment');
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <ReviewModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
        currentScore={85.0}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

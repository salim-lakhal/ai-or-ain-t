import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from '../Onboarding';

describe('Onboarding', () => {
  it('renders first step', () => {
    render(<Onboarding onComplete={vi.fn()} />);
    expect(screen.getByText('Real or AI?')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('advances to next step on click', async () => {
    render(<Onboarding onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('How to Play')).toBeInTheDocument();
    });
  });

  it('calls onComplete on final step', async () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('How to Play')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Start Swiping')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Start Swiping'));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});

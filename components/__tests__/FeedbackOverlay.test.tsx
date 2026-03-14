import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedbackOverlay from '../FeedbackOverlay';
import { VideoLabel } from '../../types';

describe('FeedbackOverlay', () => {
  it('returns null when not visible', () => {
    const { container } = render(
      <FeedbackOverlay
        isVisible={false}
        isCorrect={true}
        actualLabel={VideoLabel.REAL}
        onNext={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows correct feedback', () => {
    render(
      <FeedbackOverlay
        isVisible={true}
        isCorrect={true}
        actualLabel={VideoLabel.REAL}
        videoDescription="Test description"
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('REAL')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows incorrect feedback', () => {
    render(
      <FeedbackOverlay
        isVisible={true}
        isCorrect={false}
        actualLabel={VideoLabel.AI}
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText('AI GENERATED')).toBeInTheDocument();
  });

  it('shows next button', () => {
    const onNext = vi.fn();
    render(
      <FeedbackOverlay
        isVisible={true}
        isCorrect={true}
        actualLabel={VideoLabel.REAL}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('Next Video')).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  it('renders with zero stats', () => {
    render(
      <Header stats={{ score: 0, totalSwipes: 0, correctSwipes: 0, currentStreak: 0 }} />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('AI?')).toBeInTheDocument();
  });

  it('shows correct accuracy percentage', () => {
    render(
      <Header stats={{ score: 30, totalSwipes: 4, correctSwipes: 3, currentStreak: 2 }} />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders app title', () => {
    render(
      <Header stats={{ score: 0, totalSwipes: 0, correctSwipes: 0, currentStreak: 0 }} />,
    );
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText("Ain't")).toBeInTheDocument();
  });
});

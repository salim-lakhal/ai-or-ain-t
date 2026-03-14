import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { validateSwipeData } from '../middleware/validation.ts';

function createMockReqRes(body: Record<string, unknown>) {
  const req = { body, sanitizedData: undefined } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('validateSwipeData', () => {
  it('rejects missing required fields', () => {
    const { req, res, next } = createMockReqRes({});
    validateSwipeData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid label values', () => {
    const { req, res, next } = createMockReqRes({
      video_id: 'v1',
      correct_label: 'fake',
      user_guess: 'ai',
      is_correct: false,
      decision_time_ms: 1000,
    });
    validateSwipeData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Invalid label') }),
    );
  });

  it('rejects decision time out of range', () => {
    const { req, res, next } = createMockReqRes({
      video_id: 'v1',
      correct_label: 'ai',
      user_guess: 'real',
      is_correct: false,
      decision_time_ms: 700000,
    });
    validateSwipeData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects invalid confidence', () => {
    const { req, res, next } = createMockReqRes({
      video_id: 'v1',
      correct_label: 'ai',
      user_guess: 'ai',
      is_correct: true,
      decision_time_ms: 500,
      confidence: 5,
    });
    validateSwipeData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes valid data and sanitizes', () => {
    const { req, res, next } = createMockReqRes({
      video_id: 'v1',
      correct_label: 'AI',
      user_guess: 'REAL',
      is_correct: false,
      decision_time_ms: 1500,
      session_id: 'sess123',
      app_version: '1.0.0',
    });
    validateSwipeData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.sanitizedData).toBeDefined();
    expect(req.sanitizedData!.correct_label).toBe('ai');
    expect(req.sanitizedData!.user_guess).toBe('real');
    expect(req.sanitizedData!.user_id).toBe('anonymous');
  });

  it('truncates long video_id', () => {
    const longId = 'x'.repeat(200);
    const { req, res, next } = createMockReqRes({
      video_id: longId,
      correct_label: 'ai',
      user_guess: 'ai',
      is_correct: true,
      decision_time_ms: 100,
    });
    validateSwipeData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.sanitizedData!.video_id.length).toBe(100);
  });
});

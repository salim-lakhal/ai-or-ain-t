import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { validateRequestSize, securityHeaders } from '../middleware/security.ts';

function createMockReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  } as unknown as Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('validateRequestSize', () => {
  it('blocks requests over 10KB', () => {
    const { req, res, next } = createMockReqRes({ 'content-length': '20000' });
    validateRequestSize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows requests under 10KB', () => {
    const { req, res, next } = createMockReqRes({ 'content-length': '5000' });
    validateRequestSize(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows requests with no content-length', () => {
    const { req, res, next } = createMockReqRes({});
    validateRequestSize(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('securityHeaders', () => {
  it('sets all security headers', () => {
    const { req, res, next } = createMockReqRes();
    securityHeaders(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(next).toHaveBeenCalled();
  });
});

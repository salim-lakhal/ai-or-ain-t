import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export const validateRequestSize = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10240) {
    res.status(413).json({
      success: false,
      error: 'Request payload too large',
    });
    return;
  }
  next();
};

export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, try again later' },
});

export const swipeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many swipes, slow down' },
});

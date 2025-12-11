// Security middleware (rate limiting temporarily disabled for Express 5.x compatibility)

// Request size validator middleware
export const validateRequestSize = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10240) { // 10KB limit
    return res.status(413).json({
      success: false,
      error: 'Request payload too large'
    });
  }
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

import { Request, Response, NextFunction } from 'express';

interface SanitizedSwipeData {
  video_id: string;
  correct_label: string;
  user_guess: string;
  is_correct: boolean;
  decision_time_ms: number;
  confidence: number | null;
  session_id?: string;
  app_version?: string;
  user_id: string;
  locale?: string;
  device?: { platform?: string; model?: string };
  video_rotation_seen?: number;
  video_order_index?: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    sanitizedData?: SanitizedSwipeData;
  }
}

export const validateSwipeData = (req: Request, res: Response, next: NextFunction): void => {
  const { video_id, correct_label, user_guess, is_correct, decision_time_ms } = req.body;

  if (
    !video_id ||
    !correct_label ||
    !user_guess ||
    typeof is_correct !== 'boolean' ||
    !decision_time_ms
  ) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields',
    });
    return;
  }

  const normalizedCorrectLabel = String(correct_label).toLowerCase();
  const normalizedUserGuess = String(user_guess).toLowerCase();

  if (
    !['real', 'ai'].includes(normalizedCorrectLabel) ||
    !['real', 'ai'].includes(normalizedUserGuess)
  ) {
    res.status(400).json({
      success: false,
      error: 'Invalid label values. Must be "real" or "ai"',
    });
    return;
  }

  if (decision_time_ms < 0 || decision_time_ms > 600000) {
    res.status(400).json({
      success: false,
      error: 'Invalid decision time. Must be between 0 and 600000ms',
    });
    return;
  }

  if (req.body.confidence !== undefined && req.body.confidence !== null) {
    const confidence = parseFloat(req.body.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      res.status(400).json({
        success: false,
        error: 'Confidence must be between 0 and 1',
      });
      return;
    }
  }

  req.sanitizedData = {
    video_id: String(video_id).substring(0, 100),
    correct_label: normalizedCorrectLabel,
    user_guess: normalizedUserGuess,
    is_correct,
    decision_time_ms,
    confidence:
      req.body.confidence != null ? Math.max(0, Math.min(1, Number(req.body.confidence))) : null,
    session_id: req.body.session_id?.substring(0, 100),
    app_version: req.body.app_version?.substring(0, 20),
    user_id: req.body.user_id?.substring(0, 100) || 'anonymous',
    locale: req.body.locale?.substring(0, 10),
    device: req.body.device
      ? {
          platform: req.body.device.platform?.substring(0, 50),
          model: req.body.device.model?.substring(0, 200),
        }
      : undefined,
    video_rotation_seen: req.body.video_rotation_seen,
    video_order_index: req.body.video_order_index,
  };

  next();
};

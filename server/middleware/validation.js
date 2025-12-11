// Validation middleware for swipe data
export const validateSwipeData = (req, res, next) => {
  const {
    video_id,
    correct_label,
    user_guess,
    is_correct,
    decision_time_ms
  } = req.body;

  // Check required fields
  if (!video_id || !correct_label || !user_guess || typeof is_correct !== 'boolean' || !decision_time_ms) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  // Validate enum values
  const normalizedCorrectLabel = correct_label.toLowerCase();
  const normalizedUserGuess = user_guess.toLowerCase();

  if (!['real', 'ai'].includes(normalizedCorrectLabel) || !['real', 'ai'].includes(normalizedUserGuess)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid label values. Must be "real" or "ai"'
    });
  }

  // Validate decision time (max 10 minutes)
  if (decision_time_ms < 0 || decision_time_ms > 600000) {
    return res.status(400).json({
      success: false,
      error: 'Invalid decision time. Must be between 0 and 600000ms'
    });
  }

  // Validate confidence if present
  if (req.body.confidence !== undefined && req.body.confidence !== null) {
    const confidence = parseFloat(req.body.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      return res.status(400).json({
        success: false,
        error: 'Confidence must be between 0 and 1'
      });
    }
  }

  // Create sanitized data object (don't modify req.body directly - Express 5.x issue)
  req.sanitizedData = {
    video_id: video_id.substring(0, 100),
    correct_label: normalizedCorrectLabel,
    user_guess: normalizedUserGuess,
    is_correct,
    decision_time_ms,
    confidence: req.body.confidence !== undefined ? Math.max(0, Math.min(1, req.body.confidence)) : null,
    session_id: req.body.session_id?.substring(0, 100),
    app_version: req.body.app_version?.substring(0, 20),
    user_id: req.body.user_id?.substring(0, 100) || 'anonymous',
    locale: req.body.locale?.substring(0, 10),
    device: req.body.device ? {
      platform: req.body.device.platform?.substring(0, 50),
      model: req.body.device.model?.substring(0, 200)
    } : undefined,
    video_rotation_seen: req.body.video_rotation_seen,
    video_order_index: req.body.video_order_index
  };

  next();
};

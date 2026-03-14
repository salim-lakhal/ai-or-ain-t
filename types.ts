export enum VideoLabel {
  REAL = 'REAL',
  AI = 'AI',
}

export interface VideoItem {
  id: string;
  url: string;
  label: VideoLabel;
  description?: string;
}

export interface UserStats {
  score: number;
  totalSwipes: number;
  correctSwipes: number;
  currentStreak: number;
}

export interface SwipePayload {
  video_id: string;
  correct_label: 'real' | 'ai';
  user_guess: 'real' | 'ai';
  is_correct: boolean;
  decision_time_ms: number;
  session_id: string;
  app_version: string;
  device: { platform: string; model: string };
  video_rotation_seen?: number;
  video_order_index?: number;
}

export interface ApiVideoResponse {
  id: string;
  url: string;
  label: string;
  description?: string;
  source?: string;
}

export interface HealthResponse {
  status: string;
  db: string;
  timestamp: string;
}

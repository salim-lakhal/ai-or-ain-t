export enum VideoLabel {
  REAL = 'REAL',
  AI = 'AI'
}

export interface VideoItem {
  id: string;
  url: string;
  label: VideoLabel;
  description?: string; // For the explanation
}

export interface UserStats {
  score: number;
  totalSwipes: number;
  correctSwipes: number;
  currentStreak: number;
}

export interface SwipeResult {
  videoId: string;
  userGuess: VideoLabel;
  correct: boolean;
  timeToDecideMs: number;
}

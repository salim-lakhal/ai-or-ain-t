import { VideoItem, VideoLabel, SwipePayload, ApiVideoResponse } from '../types';

const getApiUrl = (): string => {
  const hostname = window.location.hostname;
  return `http://${hostname}:3001/api`;
};

const API_URL = getApiUrl();

function toVideoItem(v: ApiVideoResponse): VideoItem {
  return {
    id: v.id,
    url: v.url,
    label: v.label.toUpperCase() === 'AI' ? VideoLabel.AI : VideoLabel.REAL,
    description: v.description,
  };
}

export const apiService = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/health`, { mode: 'cors' });
      return res.ok;
    } catch {
      return false;
    }
  },

  fetchVideos: async (): Promise<VideoItem[] | null> => {
    try {
      const response = await fetch(`${API_URL}/videos`, { mode: 'cors' });
      if (!response.ok) return null;
      const videos: ApiVideoResponse[] = await response.json();
      return videos.map(toVideoItem);
    } catch {
      return null;
    }
  },

  seedDatabase: async (): Promise<void> => {
    try {
      await fetch(`${API_URL}/seed`, { method: 'POST', mode: 'cors' });
    } catch {
      // Seed failure is non-critical
    }
  },

  recordSwipe: async (data: SwipePayload): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/swipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        mode: 'cors',
        keepalive: true,
      });
      if (!res.ok) {
        console.error(`Swipe recording failed: ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to save swipe:', error);
    }
  },
};

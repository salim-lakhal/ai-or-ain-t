import { VideoItem } from '../types';

// Dynamically determine API URL based on where the app is accessed from
// This allows the app to work on both desktop (localhost) and mobile (via IP)
const getApiUrl = (): string => {
  const hostname = window.location.hostname;
  // If accessing via IP address (mobile), use that IP for API calls
  // Otherwise use localhost (desktop)
  return `http://${hostname}:3001/api`;
};

const API_URL = getApiUrl();

export const apiService = {
  /**
   * Check if backend is reachable
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/health`, { mode: 'cors' });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * Fetch videos from the backend.
   */
  fetchVideos: async (): Promise<VideoItem[] | null> => {
    try {
      const response = await fetch(`${API_URL}/videos`, { mode: 'cors' });
      if (!response.ok) {
        console.warn(`Fetch videos failed: ${response.status} ${response.statusText}`);
        return null;
      }
      const videos = await response.json();
      return videos;
    } catch (error) {
      console.warn("API Error (fetchVideos):", error);
      return null;
    }
  },

  /**
   * Trigger the backend to seed the database if it is empty.
   */
  seedDatabase: async (): Promise<void> => {
      try {
          const res = await fetch(`${API_URL}/seed`, { 
            method: 'POST',
            mode: 'cors'
          });
          if (!res.ok) console.warn("Seed failed:", await res.text());
      } catch (error) {
          console.warn("API Error (seedDatabase):", error);
      }
  },

  /**
   * Save user swipe data to MongoDB
   */
  recordSwipe: async (data: {
    video_id: string;
    correct_label: string;
    user_guess: string;
    is_correct: boolean;
    decision_time_ms: number;
    session_id: string;
    app_version: string;
    device: { platform: string; model: string };
    video_rotation_seen?: number;
    video_order_index?: number;
  }) => {
    try {
      // keepalive: true allows the request to outlive the page/component 
      // which is important for swipes or navigation events.
      const res = await fetch(`${API_URL}/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors',
        keepalive: true
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
    } catch (error) {
      // Log the full error to help debugging
      console.error("Failed to save swipe to backend:", error);
    }
  }
};
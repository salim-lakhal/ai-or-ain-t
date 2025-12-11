import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import SwipeDeck from './components/SwipeDeck';
import FeedbackOverlay from './components/FeedbackOverlay';
import Onboarding from './components/Onboarding';
import { apiService } from './services/apiService';
import { VideoItem, UserStats, VideoLabel } from './types';

function App() {
  // State
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Session Management
  const sessionId = useRef<string>(Math.random().toString(36).substring(7));
  const device = useRef({ platform: 'web', model: navigator.userAgent });

  const [stats, setStats] = useState<UserStats>({
    score: 0,
    totalSwipes: 0,
    correctSwipes: 0,
    currentStreak: 0
  });

  const [feedback, setFeedback] = useState<{
    isVisible: boolean;
    isCorrect: boolean;
    actualLabel: VideoLabel;
    description?: string;
  }>({ isVisible: false, isCorrect: false, actualLabel: VideoLabel.REAL });

  // Load persistence and fetch videos
  useEffect(() => {
    const storedOnboarding = localStorage.getItem('onboarding_complete');
    if (storedOnboarding === 'true') {
      setHasOnboarded(true);
    }
    
    // Initial Load Logic
    const loadVideos = async () => {
      // 1. Try to fetch from backend
      let backendVideos = await apiService.fetchVideos();

      // 2. If backend is empty, try seeding it, then fetch again
      if (!backendVideos || backendVideos.length === 0) {
         console.log("Database might be empty, attempting to seed...");
         await apiService.seedDatabase();
         // Wait a brief moment for DB to process
         await new Promise(r => setTimeout(r, 1000)); 
         backendVideos = await apiService.fetchVideos();
      }

      // 3. If still empty, show error to user
      if (backendVideos && backendVideos.length > 0) {
        setVideos(backendVideos);
      } else {
        console.error("Unable to load videos from backend. Please check your connection and try again.");
        setVideos([]);
      }
    };
    
    loadVideos();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setHasOnboarded(true);
    setStartTime(Date.now());
  };

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    const decisionTime = Date.now() - startTime;

    // Logic: Left = AI, Right = Real
    const userGuess = direction === 'left' ? VideoLabel.AI : VideoLabel.REAL;
    const isCorrect = userGuess === currentVideo.label;

    // Update Stats
    setStats(prev => ({
      score: prev.score + (isCorrect ? 10 : 0),
      totalSwipes: prev.totalSwipes + 1,
      correctSwipes: prev.correctSwipes + (isCorrect ? 1 : 0),
      currentStreak: isCorrect ? prev.currentStreak + 1 : 0
    }));

    // Send to Backend
    // This will write to 'UserData' collection
    apiService.recordSwipe({
      video_id: currentVideo.id,
      correct_label: currentVideo.label === VideoLabel.REAL ? 'real' : 'ai',
      user_guess: userGuess === VideoLabel.REAL ? 'real' : 'ai',
      is_correct: isCorrect,
      decision_time_ms: decisionTime,
      session_id: sessionId.current,
      app_version: '1.0.0',
      device: device.current,
      video_rotation_seen: 0, // Default for now
      video_order_index: currentIndex
    });

    // Show Feedback
    setFeedback({
      isVisible: true,
      isCorrect,
      actualLabel: currentVideo.label,
      description: currentVideo.description
    });

  }, [currentIndex, videos, startTime]);

  const handleNextVideo = () => {
    setFeedback(prev => ({ ...prev, isVisible: false }));
    
    if (currentIndex >= videos.length - 1) {
      // If we run out, try fetching more or reshuffle mock
      const loadMore = async () => {
         const backendVideos = await apiService.fetchVideos();
         if (backendVideos && backendVideos.length > 0) {
            setVideos(backendVideos);
            setCurrentIndex(0);
         } else {
            console.error("Unable to load more videos from backend.");
            setCurrentIndex(0);
         }
      };
      loadMore();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    setStartTime(Date.now());
  };

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen w-full bg-slate-900 text-white overflow-hidden flex flex-col relative">
      <Header stats={stats} />
      
      <main className="flex-1 w-full relative pt-[80px] pb-6">
        <SwipeDeck 
          currentVideo={videos[currentIndex] || null}
          onSwipe={handleSwipe}
          isLoading={videos.length === 0}
        />
      </main>

      <FeedbackOverlay 
        isVisible={feedback.isVisible}
        isCorrect={feedback.isCorrect}
        actualLabel={feedback.actualLabel}
        videoDescription={feedback.description}
        onNext={handleNextVideo}
      />
    </div>
  );
}

export default App;

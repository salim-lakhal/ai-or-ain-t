import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { VideoItem } from '../types';
import { Bot, RefreshCw, Check } from 'lucide-react';

interface SwipeDeckProps {
  currentVideo: VideoItem | null;
  onSwipe: (direction: 'left' | 'right') => void;
  isLoading: boolean;
}

export interface CardHandle {
  triggerSwipe: (direction: 'left' | 'right') => Promise<void>;
}

interface DraggableCardProps {
  video: VideoItem;
  onSwipe: (direction: 'left' | 'right') => void;
}

const DraggableCard = forwardRef<CardHandle, DraggableCardProps>(({ video, onSwipe }, ref) => {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const rotate = useTransform(x, [-200, 200], [-35, 35]);
  const scale = useTransform(x, [-200, 0, 200], [0.85, 1, 0.85]);

  const opacityRight = useTransform(x, [40, 150], [0, 1]);
  const opacityLeft = useTransform(x, [-40, -150], [0, 1]);

  const bgRight = useTransform(x, [0, 300], ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.4)']);
  const bgLeft = useTransform(x, [0, -300], ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.4)']);

  const boxShadow = useTransform(
    x,
    [-200, 0, 200],
    [
      '-30px 20px 60px rgba(239, 68, 68, 0.6)',
      '0px 10px 40px rgba(0,0,0,0.5)',
      '30px 20px 60px rgba(34, 197, 94, 0.6)',
    ],
  );

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (direction) => {
      if (direction === 'left') {
        await controls.start({
          x: -800,
          rotate: -45,
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.3 },
        });
        onSwipe('left');
      } else {
        await controls.start({
          x: 800,
          rotate: 45,
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.3 },
        });
        onSwipe('right');
      }
    },
  }));

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [video]);

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (info.offset.x > threshold || velocity > 500) {
      await controls.start({
        x: 800,
        rotate: 45,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 },
      });
      onSwipe('right');
    } else if (info.offset.x < -threshold || velocity < -500) {
      await controls.start({
        x: -800,
        rotate: -45,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 },
      });
      onSwipe('left');
    } else {
      controls.start({ x: 0, rotate: 0, scale: 1, boxShadow: '0px 10px 40px rgba(0,0,0,0.5)' });
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      style={{ x, rotate, scale, boxShadow, touchAction: 'none' }}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileTap={{ cursor: 'grabbing' }}
      className="relative w-full h-[80%] bg-black rounded-[32px] overflow-hidden cursor-grab z-10 border border-slate-700/50"
    >
      <motion.div
        style={{ opacity: opacityRight }}
        className="absolute top-10 left-8 z-30 border-4 border-green-500 rounded-2xl p-4 transform -rotate-12 bg-black/20 backdrop-blur-md shadow-[0_0_50px_rgba(34,197,94,0.6)]"
      >
        <span className="text-green-500 font-black text-5xl uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          REAL
        </span>
      </motion.div>

      <motion.div
        style={{ opacity: opacityLeft }}
        className="absolute top-10 right-8 z-30 border-4 border-red-500 rounded-2xl p-4 transform rotate-12 bg-black/20 backdrop-blur-md shadow-[0_0_50px_rgba(239,68,68,0.6)]"
      >
        <span className="text-red-500 font-black text-5xl uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          AI
        </span>
      </motion.div>

      <motion.div
        style={{ backgroundColor: bgRight }}
        className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
      />
      <motion.div
        style={{ backgroundColor: bgLeft }}
        className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
      />

      <motion.div
        style={{ opacity: useTransform(x, [-300, 0, 300], [0.4, 0, 0.4]) }}
        className="absolute inset-0 bg-white z-20 pointer-events-none mix-blend-soft-light"
      />

      <video
        ref={videoRef}
        src={video.url}
        className="w-full h-full object-cover pointer-events-none select-none"
        loop
        muted
        playsInline
        autoPlay
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-20 pointer-events-none" />
    </motion.div>
  );
});

DraggableCard.displayName = 'DraggableCard';

const SwipeDeck: React.FC<SwipeDeckProps> = ({ currentVideo, onSwipe, isLoading }) => {
  const cardRef = useRef<CardHandle>(null);

  if (isLoading || !currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-slate-400">
        <RefreshCw className="w-12 h-12 mb-4 animate-spin opacity-50" />
        <p className="text-sm font-medium tracking-wider uppercase">Loading Clips...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full max-w-md mx-auto px-4 perspective-1000">
      <DraggableCard ref={cardRef} key={currentVideo.id} video={currentVideo} onSwipe={onSwipe} />

      <div className="absolute bottom-6 flex justify-between w-full px-8 z-20">
        <button
          onClick={() => cardRef.current?.triggerSwipe('left')}
          className="flex flex-col items-center gap-2 group cursor-pointer transition-transform active:scale-95 focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full border-2 border-red-500 bg-red-500/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] group-hover:bg-red-500/20 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all">
            <Bot size={28} className="text-red-500" />
          </div>
          <span className="text-xs font-bold text-red-400 tracking-widest uppercase drop-shadow-md">
            AI
          </span>
        </button>

        <button
          onClick={() => cardRef.current?.triggerSwipe('right')}
          className="flex flex-col items-center gap-2 group cursor-pointer transition-transform active:scale-95 focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full border-2 border-green-500 bg-green-500/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:bg-green-500/20 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all">
            <Check size={28} className="text-green-500" />
          </div>
          <span className="text-xs font-bold text-green-400 tracking-widest uppercase drop-shadow-md">
            REAL
          </span>
        </button>
      </div>
    </div>
  );
};

export default SwipeDeck;

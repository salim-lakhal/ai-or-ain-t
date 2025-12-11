import React from 'react';
import { motion } from 'framer-motion';
import { VideoLabel } from '../types';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface FeedbackOverlayProps {
  isVisible: boolean;
  isCorrect: boolean;
  actualLabel: VideoLabel;
  videoDescription?: string;
  onNext: () => void;
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ isVisible, isCorrect, actualLabel, videoDescription, onNext }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="mb-4">
          {isCorrect ? (
            <CheckCircle className="w-20 h-20 text-green-500" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500" />
          )}
        </div>
        
        <h2 className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </h2>
        
        <p className="text-slate-300 text-lg mb-6">
          This video was <strong className="text-white">{actualLabel === VideoLabel.REAL ? 'REAL' : 'AI GENERATED'}</strong>
        </p>

        {/* Explanation from Database */}
        {videoDescription && (
          <div className="w-full mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 text-left border border-slate-700">
              <div className="flex items-center text-xs text-blue-400 mb-2 uppercase tracking-wider font-bold">
                <Info className="w-3 h-3 mr-1" />
                Why this matters
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{videoDescription}</p>
            </div>
          </div>
        )}

        <button 
          onClick={onNext}
          className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-lg hover:bg-gray-100 transition-colors"
        >
          Next Video
        </button>
      </motion.div>
    </div>
  );
};

export default FeedbackOverlay;
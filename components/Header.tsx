import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  stats: UserStats;
}

const Header: React.FC<HeaderProps> = ({ stats }) => {
  const accuracy = stats.totalSwipes > 0 
    ? Math.round((stats.correctSwipes / stats.totalSwipes) * 100) 
    : 0;

  return (
    <div className="absolute top-0 inset-x-0 h-[72px] bg-slate-900/95 backdrop-blur-xl z-40 flex items-center justify-between px-6 border-b border-slate-800 shadow-lg shadow-black/20">
       <div className="flex items-center gap-3">
          <img 
            src="https://ih1.redbubble.net/image.5494804801.8633/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg" 
            className="w-10 h-10 rounded-lg object-cover border border-slate-700 shadow-md" 
            alt="Logo" 
          />
          <h1 className="text-2xl font-black tracking-tighter leading-none select-none flex items-center">
            {/* Simple Solid Colors */}
            <span className="text-red-500 drop-shadow-sm">AI</span>
            <span className="text-slate-500 mx-1.5 text-lg italic font-serif">or</span>
            <span className="text-green-500 drop-shadow-sm">Ain't</span>
          </h1>
       </div>

       <div className="flex items-center space-x-3">
         <div className="flex flex-col items-end group cursor-help">
            <div className="flex items-center space-x-1">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-orange-400 tabular-nums">{stats.currentStreak}</span>
            </div>
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Streak</span>
         </div>
         
         <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-1"></div>

         <div className="flex flex-col items-end group cursor-help">
            <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-500 group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-bold text-white tabular-nums">{accuracy}%</span>
            </div>
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Accuracy</span>
         </div>
       </div>
    </div>
  );
};

export default Header;
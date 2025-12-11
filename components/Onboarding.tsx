import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, ScanFace, Smartphone, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Real or AI?",
    desc: "Deepfakes are getting better. Can you tell the difference? We're building a dataset to help detect them.",
    icon: <ScanFace className="w-16 h-16 text-blue-400" />,
  },
  {
    title: "How to Play",
    desc: "Swipe RIGHT if you think it's REAL. Swipe LEFT if you think it's AI generated.",
    icon: <Smartphone className="w-16 h-16 text-purple-400" />,
  },
  {
    title: "Master the Skill",
    desc: "You'll get instant feedback. Learn the artifacts: weird hands, floating objects, and uncanny movements.",
    icon: <Sparkles className="w-16 h-16 text-yellow-400" />,
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="mb-6 p-6 bg-slate-800 rounded-full shadow-xl shadow-blue-500/10">
              {STEPS[step].icon}
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">{STEPS[step].title}</h1>
            <p className="text-slate-300 text-lg leading-relaxed">{STEPS[step].desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex space-x-2 mt-4">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`} 
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {step === STEPS.length - 1 ? 'Start Swiping' : 'Next'}
          {step === STEPS.length - 1 ? <Check size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
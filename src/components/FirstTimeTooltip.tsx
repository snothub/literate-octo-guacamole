import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type FirstTimeTooltipProps = {
  isPlaying: boolean;
  hasLoopStart: boolean;
  hasLoopEnd: boolean;
  hasActiveLoop: boolean;
};

export const FirstTimeTooltip = ({
  isPlaying,
  hasLoopStart,
  hasLoopEnd,
  hasActiveLoop,
}: FirstTimeTooltipProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [hasSeenFirstTime, setHasSeenFirstTime] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('loop_trainer_first_time_seen');
    setHasSeenFirstTime(seen === 'true');
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('loop_trainer_first_time_seen', 'true');
    setHasSeenFirstTime(true);
  };

  // Don't show if user has seen it before, dismissed it, or already has an active loop
  if (hasSeenFirstTime || dismissed || hasActiveLoop) {
    return null;
  }

  // Show different messages based on progress
  let message = '';
  let step = 1;

  if (!isPlaying) {
    message = "▶️ Start playing the track, then press S when you reach your desired loop start point";
    step = 1;
  } else if (!hasLoopStart) {
    message = "Press S now to set the loop start point at the current position";
    step = 1;
  } else if (!hasLoopEnd) {
    message = "Great! Now press E to set the loop end point (loop will be created automatically)";
    step = 2;
  } else {
    message = "Perfect! Your loop is created. Enable it in the left panel to start repeating";
    step = 3;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-2xl border border-emerald-400/50 flex items-center gap-3 max-w-md">
        <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
          {step}
        </div>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


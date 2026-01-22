import { Circle, CircleDot, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { useState } from 'react';

type PlayControlsProps = {
  playing: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  activeLoopId: string | null;
  duration: number;
  progress: number;
  onTogglePlay: () => void;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onClearLoop: () => void;
  onSkipBack: (seconds: number) => void;
  onSkipForward: (seconds: number) => void;
};

const SKIP_INTERVALS = [5, 10, 20, 30, 60] as const;

export const PlayControls = ({
  playing,
  loopStart,
  loopEnd,
  activeLoopId,
  duration,
  progress,
  onTogglePlay,
  onSetLoopStart,
  onSetLoopEnd,
  onClearLoop,
  onSkipBack,
  onSkipForward,
}: PlayControlsProps) => {
  const [skipInterval, setSkipInterval] = useState<5 | 10 | 20 | 30 | 60>(10);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Main Playback Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Skip Back */}
        <button
          onClick={() => onSkipBack(skipInterval)}
          disabled={progress < skipInterval * 1000}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 sm:p-4 rounded-full transition-all flex-shrink-0 shadow-lg active:scale-95"
          title={`Skip back ${skipInterval}s`}
        >
          <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white p-4 sm:p-5 rounded-full transition-all flex-shrink-0 shadow-lg shadow-emerald-500/30 active:scale-95"
        >
          {playing ? (
            <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />
          )}
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => onSkipForward(skipInterval)}
          disabled={progress + skipInterval * 1000 > duration}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 sm:p-4 rounded-full transition-all flex-shrink-0 shadow-lg active:scale-95"
          title={`Skip forward ${skipInterval}s`}
        >
          <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Loop Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onSetLoopStart}
          disabled={!playing || Boolean(activeLoopId)}
          className={`p-2 sm:p-2.5 rounded-lg transition-all shadow-md relative group ${
            loopStart !== null
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
          title="Set loop start (S)"
        >
          <CircleDot className="w-4 h-4 sm:w-5 sm:h-5" />
          {loopStart === null && !activeLoopId && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium shadow-lg">
              Set Start
            </span>
          )}
        </button>
        <button
          onClick={onSetLoopEnd}
          disabled={!playing || Boolean(activeLoopId)}
          className={`p-2 sm:p-2.5 rounded-lg transition-all shadow-md relative group ${
            loopEnd !== null
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
          title="Set loop end (E)"
        >
          <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
          {loopStart !== null && loopEnd === null && !activeLoopId && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium shadow-lg animate-pulse">
              Set End
            </span>
          )}
        </button>
        {(loopStart !== null || loopEnd !== null) && (
          <button
            onClick={onClearLoop}
            className="p-2 sm:p-2.5 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all shadow-md active:scale-95"
            title="Clear loop"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Skip Interval Selector */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-gray-400">Skip interval: {skipInterval}s</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {SKIP_INTERVALS.map((interval) => (
            <button
              key={interval}
              onClick={() => setSkipInterval(interval)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                skipInterval === interval
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700/50'
              }`}
            >
              {interval}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

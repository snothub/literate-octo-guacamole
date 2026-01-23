import type { LoopSegment } from '../types/ui';
import { formatTime } from '../utils/time';

type SavedLoopsPaneProps = {
  loops: LoopSegment[];
  activeLoopId: string | null;
  onSeekLoop?: (loop: LoopSegment) => void;
};

export const SavedLoopsPane = ({ loops, activeLoopId, onSeekLoop }: SavedLoopsPaneProps) => {
  if (loops.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-sm">No saved loops yet. Create one in the Loop Controls tab!</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
          Saved Loops ({loops.length})
        </h4>
        <div className="space-y-2">
          {loops.map((loop) => {
            const isActive = loop.id === activeLoopId;
            return (
              <button
                key={loop.id}
                type="button"
                onClick={() => onSeekLoop?.(loop)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left active:scale-98 ${
                  isActive
                    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-transparent bg-gray-800/50 hover:bg-gray-700/70 hover:border-gray-600/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex w-3 h-3 rounded-full flex-shrink-0 shadow-md"
                    style={{ backgroundColor: loop.color }}
                  />
                  <span className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                    {loop.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 font-mono">
                  {formatTime(loop.start)} - {formatTime(loop.end)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import type { LoopSegment } from '../types/ui';
import { formatTime } from '../utils/time';

type LoopListProps = {
  loops: LoopSegment[];
  activeLoopId: string | null;
  onSeekLoop: (loop: LoopSegment) => void;
};

export const LoopList = ({ loops, activeLoopId, onSeekLoop }: LoopListProps) => {
  if (loops.length === 0) return null;

  return (
    <div className="bg-gray-800/60 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-200 mb-3">Saved Loops</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {loops.map((loop) => {
          const isActive = loop.id === activeLoopId;
          return (
            <button
              key={loop.id}
              type="button"
              onClick={() => onSeekLoop(loop)}
              className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded border transition-all text-left ${
                isActive ? 'border-white/40 bg-gray-700' : 'border-transparent bg-gray-800/50 hover:bg-gray-700/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: loop.color }} />
                <span className="text-sm text-white truncate">{loop.label}</span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatTime(loop.start)} - {formatTime(loop.end)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


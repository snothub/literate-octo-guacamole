import { formatTime } from '../utils/time';
import type { MagnifierState } from '../types/ui';

type ProgressBarProps = {
  progress: number;
  duration: number;
  loopStart: number | null;
  loopEnd: number | null;
  isDragging: boolean;
  magnifier: MagnifierState;
  draggingMarker: 'start' | 'end' | null;
  progressBarRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMarkerMouseDown: (event: React.MouseEvent, marker: 'start' | 'end') => void;
};

export const ProgressBar = ({
  progress,
  duration,
  loopStart,
  loopEnd,
  isDragging,
  magnifier,
  draggingMarker,
  progressBarRef,
  onMouseDown,
  onMarkerMouseDown,
}: ProgressBarProps) => {
  return (
    <div className="flex items-center gap-3 w-full max-w-[80vw] pt-12">
      <span className="text-gray-400 text-xs min-w-[40px] text-right">{formatTime(progress)}</span>
      <div
        ref={progressBarRef}
        className={`flex-1 h-3 bg-gray-700 rounded-full group select-none relative ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
        onMouseDown={onMouseDown}
      >
        {magnifier.visible && (
          <div
            className="absolute -top-12 -translate-x-1/2 w-16 h-16 rounded-full bg-white/10 border border-white/30 text-white text-sm font-semibold flex items-center justify-center backdrop-blur-sm shadow-lg"
            style={{ left: `${magnifier.leftPercent}%` }}
          >
            {magnifier.timeSec}s
          </div>
        )}
        {loopStart !== null && loopEnd !== null && loopStart < loopEnd && (
          <div
            className="absolute h-full bg-yellow-500/30 rounded-full"
            style={{
              left: `${(loopStart / duration) * 100}%`,
              width: `${((loopEnd - loopStart) / duration) * 100}%`,
            }}
          />
        )}

        <div
          className="h-full bg-green-500 rounded-full relative group-hover:bg-green-400 transition-colors"
          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
        >
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-opacity ${
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          />
        </div>

        {loopStart !== null && (
          <div className="absolute -top-12 -translate-x-1/2" style={{ left: `${(loopStart / duration) * 100}%` }}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-yellow-400 whitespace-nowrap">
              Start
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-12 bg-yellow-400 top-0" />
            <div
              onMouseDown={(event) => onMarkerMouseDown(event, 'start')}
              className={`w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg transition-transform flex items-center justify-center text-xs font-bold text-gray-900 ${
                draggingMarker === 'start' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
              }`}
            >
              S
            </div>
          </div>
        )}

        {loopEnd !== null && (
          <div className="absolute -top-12 -translate-x-1/2" style={{ left: `${(loopEnd / duration) * 100}%` }}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-yellow-400 whitespace-nowrap">
              End
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-12 bg-yellow-400 top-0" />
            <div
              onMouseDown={(event) => onMarkerMouseDown(event, 'end')}
              className={`w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg transition-transform flex items-center justify-center text-xs font-bold text-gray-900 ${
                draggingMarker === 'end' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
              }`}
            >
              E
            </div>
          </div>
        )}
      </div>
      <span className="text-gray-400 text-xs min-w-[40px]">{formatTime(duration)}</span>
    </div>
  );
};


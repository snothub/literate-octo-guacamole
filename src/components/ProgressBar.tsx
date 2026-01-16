import { formatTime } from '../utils/time';
import type { LoopSegment, MagnifierState } from '../types/ui';

type ProgressBarProps = {
  progress: number;
  duration: number;
  loopStart: number | null;
  loopEnd: number | null;
  loops: LoopSegment[];
  activeLoopId: string | null;
  isDragging: boolean;
  magnifier: MagnifierState;
  draggingMarker: 'start' | 'end' | null;
  progressBarRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMarkerMouseDown: (event: React.MouseEvent, marker: 'start' | 'end') => void;
  onLoopClick: (loop: LoopSegment) => void;
};

export const ProgressBar = ({
  progress,
  duration,
  loopStart,
  loopEnd,
  loops,
  activeLoopId,
  isDragging,
  magnifier,
  draggingMarker,
  progressBarRef,
  onMouseDown,
  onMarkerMouseDown,
  onLoopClick,
}: ProgressBarProps) => {
  const activeLoopColor = loops.find((loop) => loop.id === activeLoopId)?.color || '#f59e0b';
  return (
    <div className="flex items-center gap-3 w-full max-w-[80vw] pt-12">
      <span className="text-gray-400 text-xs min-w-[40px] text-right">{formatTime(progress)}</span>
      <div className="flex-1 relative">
        <div className="absolute -top-6 left-0 right-0 h-4">
          {loops.map((loop) => {
            if (!duration) return null;
            const left = (loop.start / duration) * 100;
            const width = ((loop.end - loop.start) / duration) * 100;
            const isActive = loop.id === activeLoopId;
            return (
              <button
                key={`${loop.id}-top`}
                type="button"
                className={`absolute h-full rounded-full transition-opacity flex items-center justify-center px-1 text-[10px] font-semibold text-white ${
                  isActive ? 'opacity-90 ring-2 ring-white/60' : 'opacity-60 hover:opacity-85'
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: loop.color,
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onLoopClick(loop);
                }}
                title={loop.label}
              >
                <span className="truncate w-full">{loop.label}</span>
              </button>
            );
          })}
        </div>
        <div
          ref={progressBarRef}
          className={`h-3 bg-gray-700 rounded-full group select-none relative ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
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
        {loops.map((loop) => {
          if (!duration) return null;
          const left = (loop.start / duration) * 100;
          const width = ((loop.end - loop.start) / duration) * 100;
          const isActive = loop.id === activeLoopId;
          return (
            <button
              key={loop.id}
              type="button"
              className={`absolute h-full rounded-full transition-opacity ${
                isActive ? 'opacity-70 ring-2 ring-white/60' : 'opacity-35 hover:opacity-60'
              }`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: loop.color,
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onLoopClick(loop);
              }}
              title={loop.label}
            />
          );
        })}

        <div
          className="h-full bg-green-500/80 rounded-full relative group-hover:bg-green-400 transition-colors"
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
            <div
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap"
              style={{ color: activeLoopColor }}
            >
              Start
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-0.5 h-12 top-0"
              style={{ backgroundColor: activeLoopColor }}
            />
            <div
              onMouseDown={(event) => onMarkerMouseDown(event, 'start')}
              className={`w-5 h-5 rounded-full border-2 shadow-lg transition-transform flex items-center justify-center text-xs font-bold text-gray-900 ${
                draggingMarker === 'start' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
              }`}
              style={{ backgroundColor: activeLoopColor, borderColor: activeLoopColor }}
            >
              S
            </div>
          </div>
        )}

        {loopEnd !== null && (
          <div className="absolute -top-12 -translate-x-1/2" style={{ left: `${(loopEnd / duration) * 100}%` }}>
            <div
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap"
              style={{ color: activeLoopColor }}
            >
              End
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-0.5 h-12 top-0"
              style={{ backgroundColor: activeLoopColor }}
            />
            <div
              onMouseDown={(event) => onMarkerMouseDown(event, 'end')}
              className={`w-5 h-5 rounded-full border-2 shadow-lg transition-transform flex items-center justify-center text-xs font-bold text-gray-900 ${
                draggingMarker === 'end' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
              }`}
              style={{ backgroundColor: activeLoopColor, borderColor: activeLoopColor }}
            >
              E
            </div>
          </div>
        )}
        </div>
      </div>
      <span className="text-gray-400 text-xs min-w-[40px]">{formatTime(duration)}</span>
    </div>
  );
};


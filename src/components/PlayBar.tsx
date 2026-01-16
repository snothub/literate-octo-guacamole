import { Circle, CircleDot, Pause, Play, X } from 'lucide-react';
import type { LyricLine } from '../types/spotify';
import type { LoopSegment, MagnifierState } from '../types/ui';
import { LyricsDisplay } from './LyricsDisplay';
import { ProgressBar } from './ProgressBar';

type PlayBarProps = {
  playing: boolean;
  usingPreview: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  loops: LoopSegment[];
  activeLoopId: string | null;
  progress: number;
  duration: number;
  isDragging: boolean;
  magnifier: MagnifierState;
  draggingMarker: 'start' | 'end' | null;
  segmentWasDragged: boolean;
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  lyricsContainerRef: React.RefObject<HTMLDivElement>;
  onLyricsLineClick?: (timeMs: number) => void;
  progressBarRef: React.RefObject<HTMLDivElement>;
  onTogglePlay: () => void;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onClearLoop: () => void;
  onProgressMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMarkerMouseDown: (event: React.MouseEvent, marker: 'start' | 'end') => void;
  onLoopClick: (loop: LoopSegment) => void;
  onSegmentMouseDown: (event: React.MouseEvent, loop: LoopSegment) => void;
};

export const PlayBar = ({
  playing,
  usingPreview,
  loopStart,
  loopEnd,
  loops,
  activeLoopId,
  progress,
  duration,
  isDragging,
  magnifier,
  draggingMarker,
  segmentWasDragged,
  lyrics,
  lyricsLoading,
  lyricsContainerRef,
  onLyricsLineClick,
  progressBarRef,
  onTogglePlay,
  onSetLoopStart,
  onSetLoopEnd,
  onClearLoop,
  onProgressMouseDown,
  onMarkerMouseDown,
  onLoopClick,
  onSegmentMouseDown,
}: PlayBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl">
      <LyricsDisplay
        lyrics={lyrics}
        lyricsLoading={lyricsLoading}
        progress={progress}
        containerRef={lyricsContainerRef}
        onLineClick={onLyricsLineClick}
      />
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={onTogglePlay}
            className="bg-gradient-to-br from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-black p-2 sm:p-2.5 rounded-full transition-all flex-shrink-0 shadow-lg active:scale-95"
          >
            {playing ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={onSetLoopStart}
              disabled={!playing || Boolean(activeLoopId)}
              className={`p-1 sm:p-1.5 rounded-lg transition-all shadow-md ${
                loopStart !== null 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
              title="Set loop start (S)"
            >
              <CircleDot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onSetLoopEnd}
              disabled={!playing || Boolean(activeLoopId)}
              className={`p-1 sm:p-1.5 rounded-lg transition-all shadow-md ${
                loopEnd !== null 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
              title="Set loop end (E)"
            >
              <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {(loopStart !== null || loopEnd !== null) && (
              <button
                onClick={onClearLoop}
                className="p-1 sm:p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all shadow-md active:scale-95"
                title="Clear loop"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          <ProgressBar
            progress={progress}
            duration={duration}
            loopStart={loopStart}
            loopEnd={loopEnd}
            loops={loops}
            activeLoopId={activeLoopId}
            isDragging={isDragging}
            magnifier={magnifier}
            draggingMarker={draggingMarker}
            segmentWasDragged={segmentWasDragged}
            progressBarRef={progressBarRef}
            onMouseDown={onProgressMouseDown}
            onMarkerMouseDown={onMarkerMouseDown}
            onLoopClick={onLoopClick}
            onSegmentMouseDown={onSegmentMouseDown}
          />

          {usingPreview && (
            <span className="text-gray-500 text-[10px] sm:text-xs flex-shrink-0 hidden sm:inline">
              Preview
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


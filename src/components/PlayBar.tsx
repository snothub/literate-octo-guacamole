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
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  lyricsContainerRef: React.RefObject<HTMLDivElement>;
  progressBarRef: React.RefObject<HTMLDivElement>;
  onTogglePlay: () => void;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onClearLoop: () => void;
  onProgressMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMarkerMouseDown: (event: React.MouseEvent, marker: 'start' | 'end') => void;
  onLoopClick: (loop: LoopSegment) => void;
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
  lyrics,
  lyricsLoading,
  lyricsContainerRef,
  progressBarRef,
  onTogglePlay,
  onSetLoopStart,
  onSetLoopEnd,
  onClearLoop,
  onProgressMouseDown,
  onMarkerMouseDown,
  onLoopClick,
}: PlayBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
      <LyricsDisplay
        lyrics={lyrics}
        lyricsLoading={lyricsLoading}
        progress={progress}
        containerRef={lyricsContainerRef}
      />

      <div className="mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onTogglePlay}
            className="bg-white hover:bg-gray-200 text-black p-2 rounded-full transition-all flex-shrink-0"
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onSetLoopStart}
              disabled={!playing}
              className={`p-1.5 rounded transition-all ${
                loopStart !== null ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Set loop start"
            >
              <CircleDot className="w-4 h-4" />
            </button>
            <button
              onClick={onSetLoopEnd}
              disabled={!playing}
              className={`p-1.5 rounded transition-all ${
                loopEnd !== null ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Set loop end"
            >
              <Circle className="w-4 h-4" />
            </button>
            {(loopStart !== null || loopEnd !== null) && (
              <button
                onClick={onClearLoop}
                className="p-1.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all"
                title="Clear loop"
              >
                <X className="w-4 h-4" />
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
            progressBarRef={progressBarRef}
            onMouseDown={onProgressMouseDown}
            onMarkerMouseDown={onMarkerMouseDown}
            onLoopClick={onLoopClick}
          />

          {usingPreview && <span className="text-gray-500 text-xs flex-shrink-0">Preview</span>}
        </div>
      </div>
    </div>
  );
};


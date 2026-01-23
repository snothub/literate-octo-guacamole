import { Circle, CircleDot, X } from 'lucide-react';
import { useState } from 'react';
import type { LyricLine } from '../types/spotify';
import type { LoopSegment, MagnifierState } from '../types/ui';
import { LyricsDisplay } from './LyricsDisplay';
import { ProgressBar } from './ProgressBar';
import { PlayControls } from './PlayControls';

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
  onSkipBack: (seconds: number) => void;
  onSkipForward: (seconds: number) => void;
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
  onSkipBack,
  onSkipForward,
  onProgressMouseDown,
  onMarkerMouseDown,
  onLoopClick,
  onSegmentMouseDown,
}: PlayBarProps) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'lyrics'>('controls');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl flex flex-col max-h-96">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'controls'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Controls
        </button>
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'lyrics'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Lyrics
        </button>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'controls' && (
          <PlayControls
            playing={playing}
            duration={duration}
            progress={progress}
            onTogglePlay={onTogglePlay}
            onSkipBack={onSkipBack}
            onSkipForward={onSkipForward}
          />
        )}

        {activeTab === 'lyrics' && (
          <LyricsDisplay
            lyrics={lyrics}
            lyricsLoading={lyricsLoading}
            progress={progress}
            containerRef={lyricsContainerRef}
            onLineClick={onLyricsLineClick}
          />
        )}
      </div>

      {/* Fixed Footer - Progress Bar, Loop Controls, Preview */}
      <div className="flex-shrink-0 border-t border-gray-800 space-y-2 px-3 sm:px-4 py-2">
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

        {/* Loop Controls */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={onSetLoopStart}
            disabled={!playing || Boolean(activeLoopId)}
            className={`p-1.5 sm:p-2 rounded-lg transition-all shadow-md relative group ${
              loopStart !== null
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
            title="Set loop start (S)"
          >
            <CircleDot className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onSetLoopEnd}
            disabled={!playing || Boolean(activeLoopId)}
            className={`p-1.5 sm:p-2 rounded-lg transition-all shadow-md relative group ${
              loopEnd !== null
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
            title="Set loop end (E)"
          >
            <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          {(loopStart !== null || loopEnd !== null) && (
            <button
              onClick={onClearLoop}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all shadow-md active:scale-95"
              title="Clear loop"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {usingPreview && (
            <span className="text-gray-500 text-[10px] sm:text-xs flex-shrink-0 ml-auto">
              Preview
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
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

      {/* Tab Content */}
      {activeTab === 'controls' && (
        <>
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
          <PlayControls
            playing={playing}
            loopStart={loopStart}
            loopEnd={loopEnd}
            activeLoopId={activeLoopId}
            duration={duration}
            progress={progress}
            onTogglePlay={onTogglePlay}
            onSetLoopStart={onSetLoopStart}
            onSetLoopEnd={onSetLoopEnd}
            onClearLoop={onClearLoop}
            onSkipBack={onSkipBack}
            onSkipForward={onSkipForward}
          />
        </>
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

      {usingPreview && (
        <div className="px-3 sm:px-4 py-2 text-center">
          <span className="text-gray-500 text-[10px] sm:text-xs">
            Preview Mode
          </span>
        </div>
      )}
    </div>
  );
};


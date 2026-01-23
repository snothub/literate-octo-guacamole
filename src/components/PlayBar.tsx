import { Circle, CircleDot, X } from 'lucide-react';
import { useState } from 'react';
import type { Track } from '../types/spotify';
import type { LyricLine } from '../types/spotify';
import type { LoopSegment, MagnifierState } from '../types/ui';
import { LyricsDisplay } from './LyricsDisplay';
import { LoopControlsPanel } from './LoopControlsPanel';
import { ProgressBar } from './ProgressBar';
import { PlayControls } from './PlayControls';
import { RecentTracksPane } from './RecentTracksPane';

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
  recentTracks: Track[];
  onSelectTrack: (track: Track) => void;
  onLoopStartChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopEndChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopEnabledChange: (enabled: boolean) => void;
  onAddLoop: () => void;
  onRemoveLoop: (loopId: string) => void;
  onUpdateLoopLabel: (value: string) => void;
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
  recentTracks,
  onSelectTrack,
  onLoopStartChange,
  onLoopEndChange,
  onLoopEnabledChange,
  onAddLoop,
  onRemoveLoop,
  onUpdateLoopLabel,
}: PlayBarProps) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'lyrics' | 'loop' | 'recent'>('controls');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'controls'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Controls
        </button>
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'lyrics'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Lyrics
        </button>
        <button
          onClick={() => setActiveTab('loop')}
          className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'loop'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Loop Controls
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'recent'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Recent Tracks
        </button>
      </div>

      {/* Tab Content - Fixed Height, Scrollable */}
      <div className="h-48 overflow-y-auto flex-shrink-0">
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

        {activeTab === 'loop' && (
          <div className="p-4">
            <LoopControlsPanel
              loops={loops}
              activeLoopId={activeLoopId}
              loopStart={loopStart}
              loopEnd={loopEnd}
              loopEnabled={playing && activeLoopId !== null}
              onLoopStartChange={onLoopStartChange}
              onLoopEndChange={onLoopEndChange}
              onLoopEnabledChange={onLoopEnabledChange}
              onAddLoop={onAddLoop}
              onRemoveLoop={onRemoveLoop}
              onUpdateLabel={onUpdateLoopLabel}
              onSeekLoop={onLoopClick}
            />
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="p-4">
            <RecentTracksPane tracks={recentTracks} onSelectTrack={onSelectTrack} />
          </div>
        )}
      </div>

      {/* Fixed Footer - Progress Bar and Loop Controls */}
      <div className="flex-shrink-0 border-t border-gray-800 px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          {/* Loop Controls - Left */}
          <div className="flex items-center gap-1">
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

          {/* Progress Bar - Right, Flex Fill */}
          <div className="flex-1">
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
          </div>

          {/* Preview Indicator - Right */}
          {usingPreview && (
            <span className="text-gray-500 text-[10px] sm:text-xs flex-shrink-0">
              Preview
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


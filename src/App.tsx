import { useEffect, useMemo, useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { PlayBar } from './components/PlayBar';
import { SearchPanel } from './components/SearchPanel';
import { FirstTimeTooltip } from './components/FirstTimeTooltip';
import { useGlobalSpacebar } from './hooks/useGlobalSpacebar';
import { useLoopControls } from './hooks/useLoopControls';
import { useLyrics } from './hooks/useLyrics';
import { useProgressInteraction } from './hooks/useProgressInteraction';
import { useRecentTracks } from './hooks/useRecentTracks';
import { useRuntimeConfig } from './hooks/useRuntimeConfig';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useSpotifyPlayback } from './hooks/useSpotifyPlayback';
import { useSpotifySearch } from './hooks/useSpotifySearch';
import type { Track } from './types/spotify';
import type { LoopSegment } from './types/ui';
import { extractDominantColor } from './utils/colorExtractor';

export default function App() {
  const { config, loading: configLoading } = useRuntimeConfig();
  const [backgroundColor, setBackgroundColor] = useState<string>('16, 185, 129'); // Default emerald
  const { token, spotifyUserId, error, setError, login, spotifyFetch } = useSpotifyAuth();
  const { recentTracks, addRecentTrack } = useRecentTracks({ spotifyUserId });
  const { query, setQuery, results, loading, resetSearch } = useSpotifySearch({
    token,
    spotifyFetch,
    setError,
  });
  const [selected, setSelected] = useState<Track | null>(null);
  const {
    deviceId,
    usingPreview,
    playing,
    progress,
    duration,
    togglePlay,
    playFromPosition,
    seekToMs,
    resetPlaybackForTrack,
  } = useSpotifyPlayback({
    token,
    selected,
    spotifyFetch,
    setError,
  });
  const { lyrics, lyricsLoading, lyricsContainerRef, fetchLyrics, clearLyrics } = useLyrics(progress);
  const {
    loops,
    activeLoopId,
    loopStart,
    loopEnd,
    loopEnabled,
    selectLoop,
    addLoop,
    removeLoop,
    setLoopEnabled,
    setLoopStartValue,
    setLoopEndValue,
    updateLoopRange,
    setLoopStartPoint,
    setLoopEndPoint,
    clearLoop,
    handleLoopStartChange,
    handleLoopEndChange,
    updateLoopLabel,
    initializeLoopForTrack,
  } = useLoopControls({
    progress,
    duration,
    playing,
    onSeekToMs: seekToMs,
    selectedTrackId: selected?.id ?? null,
    spotifyUserId,
  });
  const {
    isDragging,
    draggingMarker,
    segmentWasDragged,
    magnifier,
    progressBarRef,
    handleMouseDown,
    handleMarkerMouseDown,
    handleSegmentMouseDown,
  } = useProgressInteraction({
    duration,
    selectedId: selected?.id ?? null,
    loopStart,
    loopEnd,
    loops,
    onSeekToMs: seekToMs,
    onSetLoopStart: (value) => setLoopStartValue(value),
    onSetLoopEnd: (value) => setLoopEndValue(value),
    onSelectLoop: selectLoop,
    onUpdateLoopRange: updateLoopRange,
  });

  useGlobalSpacebar(() => {
    void togglePlay();
  });

  const loopIndexById = useMemo(() => {
    return new Map(loops.map((loop, index) => [loop.id, index]));
  }, [loops]);

  const selectLoopAtIndex = async (index: number) => {
    const nextLoop = loops[index];
    if (!nextLoop) return;
    selectLoop(nextLoop.id);
    await playFromPosition(nextLoop.start);
  };

  const moveToAdjacentLoop = async (direction: -1 | 1) => {
    if (loops.length === 0) return;
    const currentIndex = activeLoopId ? loopIndexById.get(activeLoopId) ?? -1 : -1;
    const nextIndex = (currentIndex + direction + loops.length) % loops.length;
    await selectLoopAtIndex(nextIndex);
  };

  const nudgeLoopPoint = (target: 'start' | 'end', deltaMs: number) => {
    if (!duration) return;
    if (target === 'start') {
      const current = loopStart ?? 0;
      const next = Math.max(0, Math.min(duration, current + deltaMs));
      setLoopStartValue(next);
      if (loopEnd !== null && next > loopEnd) {
        setLoopEndValue(next);
      }
    } else {
      const current = loopEnd ?? 0;
      const next = Math.max(0, Math.min(duration, current + deltaMs));
      setLoopEndValue(next);
      if (loopStart !== null && next < loopStart) {
        setLoopStartValue(next);
      }
    }
  };

  const handleSetLoopEnd = () => {
    setLoopEndPoint();
    // Automatically add the loop if both start and end are set and no active loop exists
    if (loopStart !== null && !activeLoopId) {
      // Need to wait a tick for the state to update
      setTimeout(() => {
        addLoop();
      }, 0);
    }
  };

  useEffect(() => {
    const isTextInputTarget = (target: EventTarget | null) => {
      if (!target || !(target as HTMLElement).tagName) return false;
      const element = target as HTMLElement;
      const tagName = element.tagName;
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || element.isContentEditable;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextInputTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const isShift = event.shiftKey;
      const isAlt = event.altKey;
      const isCtrl = event.ctrlKey || event.metaKey;

      if (key === 's') {
        event.preventDefault();
        setLoopStartPoint();
        return;
      }
      if (key === 'e') {
        event.preventDefault();
        handleSetLoopEnd();
        return;
      }
      if (key === 'l') {
        event.preventDefault();
        setLoopEnabled(!loopEnabled);
        return;
      }
      if (key === 'p') {
        event.preventDefault();
        if (loopStart !== null) {
          void playFromPosition(loopStart);
        }
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        event.preventDefault();
        if (isAlt) {
          void moveToAdjacentLoop(direction);
          return;
        }
        const step = isShift ? 250 : 50;
        if (isCtrl) {
          nudgeLoopPoint('end', direction * step);
          return;
        }
        nudgeLoopPoint('start', direction * step);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    duration,
    loopStart,
    loopEnd,
    loopEnabled,
    loops,
    activeLoopId,
    loopIndexById,
    setLoopEnabled,
    setLoopStartPoint,
    handleSetLoopEnd,
    setLoopStartValue,
    setLoopEndValue,
    playFromPosition,
    selectLoop,
  ]);

  const handleLoopClick = async (loop: LoopSegment) => {
    selectLoop(loop.id);
    await playFromPosition(loop.start);
  };

  const handleSelectTrack = async (track: Track) => {
    resetPlaybackForTrack(track);
    setSelected(track);
    resetSearch();
    clearLyrics();
    setError('');
    void addRecentTrack(track);

    const artistName = track.artists[0]?.name || '';
    void fetchLyrics(track.name, artistName);
    await initializeLoopForTrack(track.id);

    // Extract color from album cover
    const imageUrl = track.album.images[0]?.url;
    if (imageUrl) {
      try {
        const color = await extractDominantColor(imageUrl);
        setBackgroundColor(color);
      } catch (err) {
        console.error('Failed to extract color:', err);
        // Keep current background color on error
      }
    }
  };

  // Wait for runtime config to load
  if (configLoading || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading configuration...</div>
      </div>
    );
  }

  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div 
      className="min-h-screen p-3 sm:p-4 md:p-6 pb-32 sm:pb-36 transition-colors duration-1000"
      style={{
        background: `radial-gradient(ellipse at top, rgba(${backgroundColor}, 0.4), transparent 50%), 
                     radial-gradient(ellipse at bottom, rgba(${backgroundColor}, 0.3), transparent 50%),
                     linear-gradient(to bottom right, rgb(17, 24, 39), rgba(${backgroundColor}, 0.1), rgb(17, 24, 39))`
      }}
    >
      {selected && (
        <FirstTimeTooltip
          isPlaying={playing}
          hasLoopStart={loopStart !== null}
          hasLoopEnd={loopEnd !== null}
          hasActiveLoop={activeLoopId !== null}
        />
      )}

      <div className="max-w-[1800px] mx-auto">
        {/* Desktop: 3 columns | Tablet: 2 columns | Mobile: Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr] gap-4 md:gap-6 pt-4 sm:pt-8 md:pt-12">

          {/* Center Column - Search */}
          <div className="space-y-4">
            <SearchPanel
              className="w-full"
              query={query}
              onQueryChange={setQuery}
              loading={loading}
              error={error}
              results={results}
              selected={selected}
              usingPreview={usingPreview}
              deviceId={deviceId}
              onSelectTrack={handleSelectTrack}
            />
          </div>

        </div>
      </div>

      <PlayBar
        playing={playing}
        usingPreview={usingPreview}
        loopStart={loopStart}
        loopEnd={loopEnd}
        loops={loops}
        activeLoopId={activeLoopId}
        progress={progress}
        duration={duration}
        isDragging={isDragging}
        magnifier={magnifier}
        draggingMarker={draggingMarker}
        segmentWasDragged={segmentWasDragged}
        lyrics={lyrics}
        lyricsLoading={lyricsLoading}
        lyricsContainerRef={lyricsContainerRef}
        onLyricsLineClick={(timeMs) => {
          void playFromPosition(timeMs);
        }}
        progressBarRef={progressBarRef}
        onTogglePlay={togglePlay}
        onSetLoopStart={setLoopStartPoint}
        onSetLoopEnd={handleSetLoopEnd}
        onClearLoop={clearLoop}
        onSkipBack={(seconds) => {
          void seekToMs(Math.max(0, progress - seconds * 1000));
        }}
        onSkipForward={(seconds) => {
          void seekToMs(Math.min(duration, progress + seconds * 1000));
        }}
        onProgressMouseDown={handleMouseDown}
        onMarkerMouseDown={handleMarkerMouseDown}
        onLoopClick={handleLoopClick}
        onSegmentMouseDown={handleSegmentMouseDown}
        recentTracks={recentTracks}
        onSelectTrack={handleSelectTrack}
        onLoopStartChange={handleLoopStartChange}
        onLoopEndChange={handleLoopEndChange}
        onLoopEnabledChange={setLoopEnabled}
        onAddLoop={addLoop}
        onRemoveLoop={removeLoop}
        onUpdateLoopLabel={updateLoopLabel}
      />
    </div>
  );
}
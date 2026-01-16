import { useEffect, useMemo, useState } from 'react';
import { LoopControlsPanel } from './components/LoopControlsPanel';
import { LoopList } from './components/LoopList';
import { LoginScreen } from './components/LoginScreen';
import { PlayBar } from './components/PlayBar';
import { RecentTracksPane } from './components/RecentTracksPane';
import { SearchPanel } from './components/SearchPanel';
import { useGlobalSpacebar } from './hooks/useGlobalSpacebar';
import { useLoopControls } from './hooks/useLoopControls';
import { useLyrics } from './hooks/useLyrics';
import { useProgressInteraction } from './hooks/useProgressInteraction';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useSpotifyPlayback } from './hooks/useSpotifyPlayback';
import { useSpotifySearch } from './hooks/useSpotifySearch';
import type { Track } from './types/spotify';
import type { LoopSegment } from './types/ui';

export default function App() {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const { token, spotifyUserId, error, setError, login, spotifyFetch } = useSpotifyAuth();
  const { query, setQuery, results, loading, search, resetSearch } = useSpotifySearch({
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
    clearSelection,
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

  useEffect(() => {
    const stored = localStorage.getItem('recent_tracks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Track[];
        setRecentTracks(parsed);
      } catch {
        localStorage.removeItem('recent_tracks');
      }
    }
  }, []);

  const updateRecentTracks = (track: Track) => {
    setRecentTracks((prev) => {
      const next = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 10);
      localStorage.setItem('recent_tracks', JSON.stringify(next));
      return next;
    });
  };

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
        setLoopEndPoint();
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
    setLoopEndPoint,
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
    updateRecentTracks(track);

    const artistName = track.artists[0]?.name || '';
    void fetchLyrics(track.name, artistName);
    await initializeLoopForTrack(track.id);
  };


  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4 pb-28">
      <div className="max-w-7xl mx-auto pt-12 flex gap-6 items-stretch">
        <div className="flex-1 max-w-xl space-y-4">
          <SearchPanel
            className="w-full"
            query={query}
            onQueryChange={setQuery}
            onSearch={search}
            loading={loading}
            error={error}
            results={results}
            selected={selected}
            usingPreview={usingPreview}
            deviceId={deviceId}
            onSelectTrack={handleSelectTrack}
          />
          {selected && <LoopList loops={loops} activeLoopId={activeLoopId} onSeekLoop={handleLoopClick} />}
        </div>

        {selected && (
          <div className="flex gap-4">
            <LoopControlsPanel
              loops={loops}
              activeLoopId={activeLoopId}
              loopStart={loopStart}
              loopEnd={loopEnd}
              loopEnabled={loopEnabled}
              onLoopStartChange={handleLoopStartChange}
              onLoopEndChange={handleLoopEndChange}
              onLoopEnabledChange={setLoopEnabled}
              onAddLoop={addLoop}
              onRemoveLoop={removeLoop}
              onUpdateLabel={updateLoopLabel}
              onClearSelection={clearSelection}
            />
            <div className="w-80">
              <RecentTracksPane tracks={recentTracks} onSelectTrack={handleSelectTrack} />
            </div>
          </div>
        )}
      </div>

      {selected && (
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
          lyrics={lyrics}
          lyricsLoading={lyricsLoading}
          lyricsContainerRef={lyricsContainerRef}
          progressBarRef={progressBarRef}
          onTogglePlay={togglePlay}
          onSetLoopStart={setLoopStartPoint}
          onSetLoopEnd={setLoopEndPoint}
          onClearLoop={clearLoop}
          onProgressMouseDown={handleMouseDown}
          onMarkerMouseDown={handleMarkerMouseDown}
          onLoopClick={handleLoopClick}
          onSegmentMouseDown={handleSegmentMouseDown}
        />
      )}
    </div>
  );
}
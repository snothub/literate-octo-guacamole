import { useEffect, useState } from 'react';
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
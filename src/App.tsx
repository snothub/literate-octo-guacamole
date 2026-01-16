import { useState } from 'react';
import { LoopControlsPanel } from './components/LoopControlsPanel';
import { LoginScreen } from './components/LoginScreen';
import { PlayBar } from './components/PlayBar';
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
  const { isDragging, draggingMarker, magnifier, progressBarRef, handleMouseDown, handleMarkerMouseDown } =
    useProgressInteraction({
      duration,
      selectedId: selected?.id ?? null,
      loopStart,
      loopEnd,
      onSeekToMs: seekToMs,
      onSetLoopStart: (value) => setLoopStartValue(value),
      onSetLoopEnd: (value) => setLoopEndValue(value),
    });

  useGlobalSpacebar(() => {
    void togglePlay();
  });

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

    const artistName = track.artists[0]?.name || '';
    void fetchLyrics(track.name, artistName);
    await initializeLoopForTrack(track.id);
  };


  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4 pb-28">
      <div className="max-w-7xl mx-auto pt-12 flex gap-6">
        <SearchPanel
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

        {selected && (
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
            onSelectLoop={selectLoop}
            onSeekLoop={handleLoopClick}
            onUpdateLabel={updateLoopLabel}
            onClearSelection={clearSelection}
          />
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
        />
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import type { Track } from '../types/spotify';
import { logger } from '../utils/logger';

type UseRecentTracksArgs = {
  spotifyUserId: string | null;
};

type UseRecentTracksState = {
  recentTracks: Track[];
  addRecentTrack: (track: Track) => Promise<void>;
  loading: boolean;
};

export const useRecentTracks = ({ spotifyUserId }: UseRecentTracksArgs): UseRecentTracksState => {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent tracks on mount or when spotifyUserId changes
  useEffect(() => {
    if (spotifyUserId) {
      void loadRecentTracks();
    } else {
      setRecentTracks([]);
    }
  }, [spotifyUserId]);

  const loadRecentTracks = async () => {
    if (!spotifyUserId) return;

    setLoading(true);
    logger.info('useRecentTracks', 'recent_tracks_load_start');
    try {
      const response = await fetch(`/api/recent-tracks/${spotifyUserId}`);

      if (!response.ok) {
        logger.error('useRecentTracks', 'recent_tracks_load_failed', { status: response.status });
        return;
      }

      const tracks = await response.json();
      setRecentTracks(tracks);
      logger.info('useRecentTracks', 'recent_tracks_load_success', { count: tracks.length });
    } catch (err) {
      logger.error('useRecentTracks', 'recent_tracks_load_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecentTrack = async (track: Track) => {
    if (!spotifyUserId) return;

    logger.debug('useRecentTracks', 'recent_tracks_save_start', { trackId: track.id });
    try {
      // Optimistically update local state
      setRecentTracks((prev) => {
        const next = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 10);
        return next;
      });

      // Then sync to backend
      await fetch('/api/recent-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyUserId,
          track,
        }),
      });
      logger.debug('useRecentTracks', 'recent_tracks_save_success', { trackId: track.id });
    } catch (err) {
      logger.error('useRecentTracks', 'recent_tracks_save_failed', {
        trackId: track.id,
        error: err instanceof Error ? err.message : String(err),
      });
      // Reload from server on error
      await loadRecentTracks();
    }
  };

  return {
    recentTracks,
    addRecentTrack,
    loading,
  };
};

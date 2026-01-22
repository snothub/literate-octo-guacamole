import { useEffect, useState } from 'react';
import type { Track } from '../types/spotify';

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
    try {
      const response = await fetch(`/api/recent-tracks/${spotifyUserId}`);

      if (!response.ok) {
        console.error('Failed to load recent tracks:', response.status);
        return;
      }

      const tracks = await response.json();
      setRecentTracks(tracks);
    } catch (err) {
      console.error('Error loading recent tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addRecentTrack = async (track: Track) => {
    if (!spotifyUserId) return;

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
    } catch (err) {
      console.error('Error saving recent track:', err);
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

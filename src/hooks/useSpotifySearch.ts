import { useState } from 'react';
import type { Track } from '../types/spotify';

type UseSpotifySearchArgs = {
  token: string;
  spotifyFetch: (url: string, options?: RequestInit) => Promise<Response>;
  setError: (value: string) => void;
};

type SpotifySearchState = {
  query: string;
  setQuery: (value: string) => void;
  results: Track[];
  loading: boolean;
  search: () => Promise<void>;
  resetSearch: () => void;
};

export const useSpotifySearch = ({ token, spotifyFetch, setError }: UseSpotifySearchArgs): SpotifySearchState => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const search = async () => {
    if (!query.trim() || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await spotifyFetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.tracks.items);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setResults([]);
    setQuery('');
  };

  return { query, setQuery, results, loading, search, resetSearch };
};


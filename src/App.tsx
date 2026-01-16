import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Music, ExternalLink, CircleDot, Circle, X } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
  preview_url: string | null;
  external_urls: { spotify: string };
  duration_ms: number;
}

interface LyricLine {
  time: number; // milliseconds
  text: string;
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyState | null>;
  addListener: (event: string, callback: (state: unknown) => void) => void;
}

interface SpotifyState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: { current_track: { id: string } };
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58';
const REDIRECT_URI = window.location.origin;
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const formatTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// PKCE helpers
const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join('');
};

const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export default function App() {
  const [token, setToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [spotifyUserId, setSpotifyUserId] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Track[]>([]);
  const [selected, setSelected] = useState<Track | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [usingPreview, setUsingPreview] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingMarker, setDraggingMarker] = useState<'start' | 'end' | null>(null);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState<boolean>(false);
  const [magnifier, setMagnifier] = useState<{ leftPercent: number; timeSec: number; visible: boolean }>({
    leftPercent: 0,
    timeSec: 0,
    visible: false,
  });
  const progressInterval = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const magnifierTimeout = useRef<number | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Check for authorization code in URL (PKCE flow)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      const codeVerifier = localStorage.getItem('code_verifier');

      // Clean up URL immediately to prevent double execution
      window.history.replaceState(null, '', window.location.pathname);

      if (codeVerifier) {
        exchangeCodeForToken(code, codeVerifier);
      } else {
        // Code verifier missing, clear everything and show login
        localStorage.removeItem('code_verifier');
        setError('Authentication failed. Please try logging in again.');
      }
    } else {
      // Check if we already have a token in localStorage
      const storedToken = localStorage.getItem('spotify_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
      const storedUserId = localStorage.getItem('spotify_user_id');

      if (storedToken) {
        setToken(storedToken);
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
        if (storedUserId) {
          setSpotifyUserId(storedUserId);
        } else {
          // Fetch user profile if we have token but not user ID
          fetchSpotifyUserProfile(storedToken);
        }
      }
    }
  }, []);

  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token exchange failed:', response.status, errorData);
        throw new Error(`Failed to exchange code for token: ${response.status}`);
      }

      const data = await response.json();

      // Store tokens
      setToken(data.access_token);
      localStorage.setItem('spotify_token', data.access_token);

      // Store refresh token for later use
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      // Clean up code verifier
      localStorage.removeItem('code_verifier');

      // Fetch Spotify user profile to get user ID
      await fetchSpotifyUserProfile(data.access_token);
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please try logging in again.');

      // Clean up on error
      localStorage.removeItem('code_verifier');
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_user_id');
      setToken('');
      setRefreshToken('');
      setSpotifyUserId('');
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('spotify_token', data.access_token);

      // Spotify may return a new refresh token
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      return data.access_token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      setError('Session expired. Please log in again.');
      // Clear stored tokens
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_user_id');
      setToken('');
      setRefreshToken('');
      setSpotifyUserId('');
      return null;
    }
  };

  const fetchSpotifyUserProfile = async (accessToken: string) => {
    try {
      // Use direct fetch here since this is called during initial auth
      // before spotifyFetch is ready to use
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      setSpotifyUserId(userData.id);
      localStorage.setItem('spotify_user_id', userData.id);
    } catch (err) {
      console.error('Failed to fetch Spotify user profile:', err);
    }
  };

  // Helper function to make Spotify API calls with automatic token refresh
  const spotifyFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const makeRequest = async (accessToken: string) => {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
      return fetch(url, { ...options, headers });
    };

    let response = await makeRequest(token);

    // If we get 401, try refreshing the token once
    if (response.status === 401 && refreshToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      }
    }

    return response;
  };

  useEffect(() => {
    if (!token) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: 'Spotify Search App',
        getOAuthToken: cb => cb(token),
        volume: 0.5
      });

      p.addListener('ready', (state: unknown) => {
        const { device_id } = state as { device_id: string };
        setDeviceId(device_id);
      });

      p.addListener('player_state_changed', (state: unknown) => {
        if (state) {
          const s = state as SpotifyState;
          setPlaying(!s.paused);
          setProgress(s.position);
          setDuration(s.duration);
        }
      });

      p.connect();
      setPlayer(p);
    };

    return () => {
      player?.disconnect();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [token]);

  // Progress tracking for SDK
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    if (playing && !usingPreview && player) {
      progressInterval.current = window.setInterval(async () => {
        const state = await player.getCurrentState();
        if (state) {
          setProgress(state.position);
          setDuration(state.duration);
        }
      }, 500);
    }
    
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [playing, usingPreview, player]);

  // Progress tracking for preview audio
  useEffect(() => {
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime * 1000);
      setDuration(audio.duration * 1000 || 30000);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [audio]);

  // Loop detection and handling
  useEffect(() => {
    if (!playing || !loopEnabled || loopStart === null || loopEnd === null) return;
    if (loopStart >= loopEnd) return; // Invalid loop

    // Check if we've passed the loop end point
    if (progress >= loopEnd) {
      if (usingPreview && audio) {
        audio.currentTime = loopStart / 1000;
      } else if (player) {
        player.seek(loopStart);
      }
    }
  }, [progress, playing, loopEnabled, loopStart, loopEnd, usingPreview, audio, player]);

  // Auto-scroll lyrics to keep current line centered
  useEffect(() => {
    if (!lyricsContainerRef.current || lyrics.length === 0) return;

    const currentIndex = lyrics.findIndex((line, index) => {
      return progress >= line.time && (index === lyrics.length - 1 || progress < lyrics[index + 1]?.time);
    });

    if (currentIndex !== -1) {
      const container = lyricsContainerRef.current;
      const lineElements = container.querySelectorAll('p');
      const currentElement = lineElements[currentIndex];

      if (currentElement) {
        const containerHeight = container.clientHeight;
        const elementTop = currentElement.offsetTop;
        const elementHeight = currentElement.clientHeight;
        const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [progress, lyrics]);

  // Auto-save loop data when it changes
  useEffect(() => {
    if (selected && spotifyUserId) {
      const timeoutId = setTimeout(() => {
        saveLoopData(selected.id, loopStart, loopEnd, loopEnabled);
      }, 500); // Debounce by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [selected, loopStart, loopEnd, loopEnabled, spotifyUserId]);

  const login = async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    localStorage.setItem('code_verifier', codeVerifier);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('code_challenge', codeChallenge);

    window.location.href = authUrl.toString();
  };

  // Loop data persistence functions
  const saveLoopData = async (trackId: string, loopStart: number | null, loopEnd: number | null, loopEnabled: boolean) => {
    if (!spotifyUserId) return;

    try {
      await fetch(`${API_URL}/api/loop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyUserId,
          trackId,
          loopStart,
          loopEnd,
          loopEnabled,
        }),
      });
    } catch (err) {
      console.error('Error saving loop data:', err);
    }
  };

  const loadLoopData = async (trackId: string) => {
    if (!spotifyUserId) return null;

    try {
      const response = await fetch(`${API_URL}/api/loop/${spotifyUserId}/${trackId}`);

      if (!response.ok) return null;

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error loading loop data:', err);
      return null;
    }
  };

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

  const selectTrack = async (track: Track) => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setSelected(track);
    setPlaying(false);
    setUsingPreview(false);
    setProgress(0);
    setDuration(track.duration_ms);
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);
    setResults([]);
    setQuery('');

    // Fetch lyrics for the selected track
    const artistName = track.artists[0]?.name || '';
    fetchLyrics(track.name, artistName);

    // Load saved loop data if user is authenticated
    if (spotifyUserId) {
      const savedLoopData = await loadLoopData(track.id);
      if (savedLoopData) {
        setLoopStart(savedLoopData.loopStart);
        setLoopEnd(savedLoopData.loopEnd);
        setLoopEnabled(savedLoopData.loopEnabled);
      }
    }
  };

  const playWithSDK = async () => {
    if (!selected || !deviceId) return;
    try {
      await spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [selected.uri] })
      });
      setPlaying(true);
      setUsingPreview(false);
    } catch {
      if (selected.preview_url) playPreview();
      else setError('Playback failed. Premium required for full playback.');
    }
  };

  const playPreview = () => {
    if (!selected?.preview_url) return;
    const a = new Audio(selected.preview_url);
    a.play();
    a.onended = () => { setPlaying(false); setProgress(0); };
    setAudio(a);
    setPlaying(true);
    setUsingPreview(true);
    setDuration(30000);
  };

  const togglePlay = async () => {
    if (!selected) return;
    if (playing) {
      if (usingPreview && audio) audio.pause();
      else await player?.pause();
      setPlaying(false);
    } else {
      if (usingPreview && audio) {
        audio.play();
        setPlaying(true);
      } else if (player) {
        const state = await player.getCurrentState();
        if (state && state.track_window.current_track.id === selected.id) {
          await player.resume();
          setPlaying(true);
        } else if (deviceId) {
          await playWithSDK();
        } else if (selected.preview_url) {
          playPreview();
        } else {
          setError('No playback available');
        }
      } else if (selected.preview_url) {
        playPreview();
      } else {
        setError('No playback available');
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
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.repeat) return;
      if (isTextInputTarget(event.target)) return;

      event.preventDefault();
      event.stopPropagation();
      void togglePlay();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (isTextInputTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [togglePlay]);

  const setLoopStartPoint = () => {
    // Constrain to not go beyond end marker
    if (loopEnd !== null && progress > loopEnd) {
      setLoopStart(loopEnd);
    } else {
      setLoopStart(progress);
    }
  };

  const setLoopEndPoint = () => {
    // Constrain to not go before start marker
    if (loopStart !== null && progress < loopStart) {
      setLoopEnd(loopStart);
    } else {
      setLoopEnd(progress);
    }
  };

  const clearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);
  };

  const parseLRC = (lrcText: string): LyricLine[] => {
    const lines: LyricLine[] = [];
    const lrcLines = lrcText.split('\n');

    for (const line of lrcLines) {
      // Match timestamp format [mm:ss.xx]
      const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const text = match[3].trim();
        const timeMs = (minutes * 60 + seconds) * 1000;

        if (text) { // Only add lines with text
          lines.push({ time: timeMs, text });
        }
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  };

  const fetchLyrics = async (trackName: string, artistName: string) => {
    setLyricsLoading(true);
    setLyrics([]);

    try {
      const response = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lyrics');
      }

      const data = await response.json();

      if (data && data.length > 0 && data[0].syncedLyrics) {
        const parsedLyrics = parseLRC(data[0].syncedLyrics);
        setLyrics(parsedLyrics);
      } else {
        setLyrics([]);
      }
    } catch (err) {
      console.error('Error fetching lyrics:', err);
      setLyrics([]);
    } finally {
      setLyricsLoading(false);
    }
  };

  const formatTimeInput = (ms: number | null): string => {
    if (ms === null) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeStr: string): number | null => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0]);
    const secs = parseInt(parts[1]);
    if (isNaN(mins) || isNaN(secs) || secs < 0 || secs >= 60) return null;
    return (mins * 60 + secs) * 1000;
  };

  const handleLoopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLoopStart(null);
      return;
    }
    const ms = parseTimeInput(value);
    if (ms !== null && ms >= 0 && ms <= duration) {
      // Constrain to not go beyond end marker
      if (loopEnd !== null && ms > loopEnd) {
        setLoopStart(loopEnd);
      } else {
        setLoopStart(ms);
      }
    }
  };

  const handleLoopEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLoopEnd(null);
      return;
    }
    const ms = parseTimeInput(value);
    if (ms !== null && ms >= 0 && ms <= duration) {
      // Constrain to not go before start marker
      if (loopStart !== null && ms < loopStart) {
        setLoopEnd(loopStart);
      } else {
        setLoopEnd(ms);
      }
    }
  };

  const seekToPosition = (clientX: number) => {
    if (!selected || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seekPos = percent * duration;

    if (usingPreview && audio) {
      audio.currentTime = seekPos / 1000;
      setProgress(seekPos);
    } else if (player) {
      player.seek(seekPos);
      setProgress(seekPos);
    }
  };

  const showMagnifier = (clientX: number) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seekPos = percent * duration;
    const timeSec = Math.floor(seekPos / 1000);

    setMagnifier({ leftPercent: percent * 100, timeSec, visible: true });
    if (magnifierTimeout.current) window.clearTimeout(magnifierTimeout.current);
    magnifierTimeout.current = window.setTimeout(() => {
      setMagnifier(prev => ({ ...prev, visible: false }));
    }, 1200);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
    showMagnifier(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      seekToPosition(e.clientX);
      showMagnifier(e.clientX);
    } else if (draggingMarker && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newPos = percent * duration;

      if (draggingMarker === 'start') {
        // Constrain start to not go beyond end
        if (loopEnd !== null) {
          setLoopStart(Math.min(newPos, loopEnd));
        } else {
          setLoopStart(newPos);
        }
      } else if (draggingMarker === 'end') {
        // Constrain end to not go before start
        if (loopStart !== null) {
          setLoopEnd(Math.max(newPos, loopStart));
        } else {
          setLoopEnd(newPos);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingMarker(null);
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, marker: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingMarker(marker);
  };

  // Handle global mouse events when dragging
  useEffect(() => {
    if (isDragging || draggingMarker) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggingMarker, duration, usingPreview, audio, player, selected]);

  useEffect(() => {
    return () => {
      if (magnifierTimeout.current) window.clearTimeout(magnifierTimeout.current);
    };
  }, []);


  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Spotify Search & Play</h1>
          <p className="text-gray-400 mb-6">Connect your Spotify account to search and play music</p>
          <button onClick={login} className="bg-green-500 hover:bg-green-400 text-black font-semibold py-3 px-8 rounded-full transition-all">
            Connect with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4 pb-28">
      <div className="max-w-7xl mx-auto pt-12 flex gap-6">
        <div className="flex-1 max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold text-white">Spotify Search</h1>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search for a song..."
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
          />
          <button onClick={search} disabled={loading} className="bg-green-500 hover:bg-green-400 text-black p-3 rounded-lg transition-all disabled:opacity-50">
            <Search className="w-6 h-6" />
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {results.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg overflow-hidden mb-4 max-h-80 overflow-y-auto">
            {results.map(track => (
              <button key={track.id} onClick={() => selectTrack(track)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-all text-left">
                <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" className="w-12 h-12 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{track.name}</p>
                  <p className="text-gray-400 text-sm truncate">{track.artists.map(a => a.name).join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="bg-gray-800/80 rounded-lg p-3 flex items-center gap-3 mb-4">
            <img src={selected.album.images[0]?.url} alt="" className="w-24 h-24 rounded shadow-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{selected.name}</h2>
              <p className="text-gray-400 text-sm truncate">{selected.artists.map(a => a.name).join(', ')}</p>
              <p className="text-gray-500 text-xs truncate">{selected.album.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <a href={selected.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-all">
                  <ExternalLink className="w-4 h-4" />
                </a>
                {usingPreview && <span className="text-gray-500 text-xs">30s preview</span>}
                {!deviceId && !selected.preview_url && <span className="text-yellow-500 text-xs">Premium required</span>}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Right Panel - Loop Controls */}
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-800/80 rounded-lg p-4 sticky top-12">
              <h3 className="text-lg font-bold text-white mb-4">Loop Controls</h3>

              <div className="space-y-3">
                {/* Start Time */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20 flex-shrink-0">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formatTimeInput(loopStart)}
                    onChange={handleLoopStartChange}
                    placeholder="0:00"
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>

                {/* End Time */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20 flex-shrink-0">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formatTimeInput(loopEnd)}
                    onChange={handleLoopEndChange}
                    placeholder="0:00"
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>

                {/* Loop Enabled Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="loopEnabled"
                    checked={loopEnabled}
                    onChange={(e) => setLoopEnabled(e.target.checked)}
                    disabled={loopStart === null || loopEnd === null || loopStart >= loopEnd}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="loopEnabled" className="text-sm text-gray-300 select-none">
                    Enable Loop
                  </label>
                </div>

                {/* Clear Button */}
                {(loopStart !== null || loopEnd !== null) && (
                  <button
                    onClick={clearLoop}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all text-sm"
                  >
                    Clear Loop Points
                  </button>
                )}

                {/* Status Info */}
                <div className="mt-4 p-3 bg-gray-700/50 rounded text-xs text-gray-400">
                  {loopStart === null && loopEnd === null && (
                    <p>Click the start and end buttons while playing to set loop points.</p>
                  )}
                  {loopStart !== null && loopEnd === null && (
                    <p>Loop start set. Click the end button to complete the loop.</p>
                  )}
                  {loopStart !== null && loopEnd !== null && !loopEnabled && (
                    <p>Loop points set. Enable the checkbox to activate looping.</p>
                  )}
                  {loopEnabled && loopStart !== null && loopEnd !== null && (
                    <p className="text-green-400">Loop is active! The segment will repeat continuously.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Play Bar */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
          {/* Lyrics Display */}
          {lyrics.length > 0 && (
            <div
              ref={lyricsContainerRef}
              className="max-w-4xl mx-auto px-4 py-3 h-32 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-transparent"
            >
              <div className="space-y-2">
                {lyrics.map((line, index) => {
                  const isCurrentLine = progress >= line.time && (index === lyrics.length - 1 || progress < lyrics[index + 1]?.time);

                  return (
                    <p
                      key={index}
                      className={`text-center transition-all duration-300 break-words ${
                        isCurrentLine
                          ? 'text-white font-semibold text-lg scale-105'
                          : 'text-gray-500 text-sm'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
          {lyricsLoading && (
            <div className="max-w-4xl mx-auto px-4 py-3 h-32 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Loading lyrics...</p>
            </div>
          )}
          {!lyricsLoading && lyrics.length === 0 && selected && (
            <div className="max-w-4xl mx-auto px-4 py-3 h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">No synced lyrics available</p>
            </div>
          )}

          <div className="mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-4">
              {/* Play Button */}
              <button onClick={togglePlay} className="bg-white hover:bg-gray-200 text-black p-2 rounded-full transition-all flex-shrink-0">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Loop Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={setLoopStartPoint}
                  disabled={!playing}
                  className={`p-1.5 rounded transition-all ${loopStart !== null ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                  title="Set loop start"
                >
                  <CircleDot className="w-4 h-4" />
                </button>
                <button
                  onClick={setLoopEndPoint}
                  disabled={!playing}
                  className={`p-1.5 rounded transition-all ${loopEnd !== null ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                  title="Set loop end"
                >
                  <Circle className="w-4 h-4" />
                </button>
                {(loopStart !== null || loopEnd !== null) && (
                  <button
                    onClick={clearLoop}
                    className="p-1.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all"
                    title="Clear loop"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 w-full max-w-[80vw] pt-12">
                <span className="text-gray-400 text-xs min-w-[40px] text-right">{formatTime(progress)}</span>
                <div
                  ref={progressBarRef}
                  className={`flex-1 h-3 bg-gray-700 rounded-full group select-none relative ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
                  onMouseDown={handleMouseDown}
                >
                  {magnifier.visible && (
                    <div
                      className="absolute -top-12 -translate-x-1/2 w-16 h-16 rounded-full bg-white/10 border border-white/30 text-white text-sm font-semibold flex items-center justify-center backdrop-blur-sm shadow-lg"
                      style={{ left: `${magnifier.leftPercent}%` }}
                    >
                      {magnifier.timeSec}s
                    </div>
                  )}
                  {/* Loop region indicator */}
                  {loopStart !== null && loopEnd !== null && loopStart < loopEnd && (
                    <div
                      className="absolute h-full bg-yellow-500/30 rounded-full"
                      style={{
                        left: `${(loopStart / duration) * 100}%`,
                        width: `${((loopEnd - loopStart) / duration) * 100}%`,
                      }}
                    />
                  )}

                  {/* Current progress */}
                  <div
                    className="h-full bg-green-500 rounded-full relative group-hover:bg-green-400 transition-colors"
                    style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                  >
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>

                  {/* Loop start marker - above progress bar */}
                  {loopStart !== null && (
                    <div
                      className="absolute -top-12 -translate-x-1/2"
                      style={{ left: `${(loopStart / duration) * 100}%` }}
                    >
                      {/* Label */}
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-yellow-400 whitespace-nowrap">
                        Start
                      </div>
                      {/* Vertical line */}
                      <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-12 bg-yellow-400 top-0" />
                      {/* Draggable marker */}
                      <div
                        onMouseDown={(e) => handleMarkerMouseDown(e, 'start')}
                        className={`w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg transition-transform flex items-center justify-center text-xs font-bold text-gray-900 ${draggingMarker === 'start' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'}`}
                      >
                        S
                      </div>
                    </div>
                  )}

                  {/* Loop end marker - above progress bar */}
                  {loopEnd !== null && (
                    <div
                      className="absolute -top-12 -translate-x-1/2"
                      style={{ left: `${(loopEnd / duration) * 100}%` }}
                    >
                      {/* Label */}
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-yellow-400 whitespace-nowrap">
                        End
                      </div>
                      {/* Vertical line */}
                      <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-12 bg-yellow-400 top-0" />
                      {/* Draggable marker */}
                      <div
                        onMouseDown={(e) => handleMarkerMouseDown(e, 'end')}
                        className={`w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg transition-transform flex items-center justify-center text-xs font-bold text-gray-900 ${draggingMarker === 'end' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'}`}
                      >
                        E
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-gray-400 text-xs min-w-[40px]">{formatTime(duration)}</span>
              </div>

              {/* Preview indicator */}
              {usingPreview && <span className="text-gray-500 text-xs flex-shrink-0">Preview</span>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
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
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const progressInterval = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for authorization code in URL (PKCE flow)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      const codeVerifier = localStorage.getItem('code_verifier');
      if (codeVerifier) {
        exchangeCodeForToken(code, codeVerifier);
      }
    } else {
      // Check if we already have a token in localStorage
      const storedToken = localStorage.getItem('spotify_token');
      if (storedToken) {
        setToken(storedToken);
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
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('spotify_token', data.access_token);
      localStorage.removeItem('code_verifier');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      setError('Authentication failed. Please try again.');
      localStorage.removeItem('code_verifier');
    }
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
    if (!playing || loopStart === null || loopEnd === null) return;
    if (loopStart >= loopEnd) return; // Invalid loop

    // Check if we've passed the loop end point
    if (progress >= loopEnd) {
      if (usingPreview && audio) {
        audio.currentTime = loopStart / 1000;
      } else if (player) {
        player.seek(loopStart);
      }
    }
  }, [progress, playing, loopStart, loopEnd, usingPreview, audio, player]);

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

  const search = async () => {
    if (!query.trim() || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const selectTrack = (track: Track) => {
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
    setResults([]);
    setQuery('');
  };

  const playWithSDK = async () => {
    if (!selected || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
      } else if (deviceId) {
        await playWithSDK();
      } else if (selected.preview_url) {
        playPreview();
      } else {
        setError('No playback available');
      }
    }
  };

  const setLoopStartPoint = () => {
    setLoopStart(progress);
  };

  const setLoopEndPoint = () => {
    setLoopEnd(progress);
  };

  const clearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      seekToPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, duration, usingPreview, audio, player, selected]);

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
      <div className="max-w-xl mx-auto pt-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Music className="w-8 h-8 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Spotify Search</h1>
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

      {/* Play Bar */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
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
              <div className="flex items-center gap-3 w-full max-w-[80vw]">
                <span className="text-gray-400 text-xs min-w-[40px] text-right">{formatTime(progress)}</span>
                <div
                  ref={progressBarRef}
                  className={`flex-1 h-1.5 bg-gray-700 rounded-full group select-none relative ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
                  onMouseDown={handleMouseDown}
                >
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
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>

                  {/* Loop start marker */}
                  {loopStart !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full border border-yellow-600"
                      style={{ left: `${(loopStart / duration) * 100}%` }}
                    />
                  )}

                  {/* Loop end marker */}
                  {loopEnd !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full border border-yellow-600"
                      style={{ left: `${(loopEnd / duration) * 100}%` }}
                    />
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
import { useEffect, useRef, useState } from 'react';
import type { SpotifyPlayer, SpotifyState, Track } from '../types/spotify';

type UseSpotifyPlaybackArgs = {
  token: string;
  selected: Track | null;
  spotifyFetch: (url: string, options?: RequestInit) => Promise<Response>;
  setError: (value: string) => void;
};

type SpotifyPlaybackState = {
  player: SpotifyPlayer | null;
  deviceId: string;
  audio: HTMLAudioElement | null;
  usingPreview: boolean;
  playing: boolean;
  progress: number;
  duration: number;
  togglePlay: () => Promise<void>;
  playFromPosition: (positionMs: number) => Promise<void>;
  seekToMs: (positionMs: number) => void;
  resetPlaybackForTrack: (track: Track) => void;
};

export const useSpotifyPlayback = ({
  token,
  selected,
  spotifyFetch,
  setError,
}: UseSpotifyPlaybackArgs): SpotifyPlaybackState => {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [usingPreview, setUsingPreview] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const progressInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: 'Music Man App',
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
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

  const playPreview = () => {
    if (!selected?.preview_url) return;
    const a = new Audio(selected.preview_url);
    a.play();
    a.onended = () => {
      setPlaying(false);
      setProgress(0);
    };
    setAudio(a);
    setPlaying(true);
    setUsingPreview(true);
    setDuration(30000);
  };

  const playWithSDK = async () => {
    if (!selected || !deviceId) return;
    try {
      await spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [selected.uri] }),
      });
      setPlaying(true);
      setUsingPreview(false);
    } catch {
      if (selected.preview_url) playPreview();
      else setError('Playback failed. Premium required for full playback.');
    }
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

  const playFromPosition = async (positionMs: number) => {
    if (!selected) return;
    if (usingPreview && audio) {
      audio.currentTime = positionMs / 1000;
      await audio.play();
      setPlaying(true);
      setProgress(positionMs);
      return;
    }

    if (player && deviceId) {
      try {
        await spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: [selected.uri], position_ms: Math.max(0, Math.floor(positionMs)) }),
        });
        setPlaying(true);
        setUsingPreview(false);
        setProgress(positionMs);
        return;
      } catch {
        if (selected.preview_url) {
          playPreview();
          return;
        }
        setError('Playback failed. Premium required for full playback.');
        return;
      }
    }

    if (selected.preview_url) {
      playPreview();
      return;
    }
    setError('No playback available');
  };

  const seekToMs = (positionMs: number) => {
    if (!selected) return;
    if (usingPreview && audio) {
      audio.currentTime = positionMs / 1000;
      setProgress(positionMs);
    } else if (player) {
      player.seek(positionMs);
      setProgress(positionMs);
    }
  };

  const resetPlaybackForTrack = (track: Track) => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setPlaying(false);
    setUsingPreview(false);
    setProgress(0);
    setDuration(track.duration_ms);
  };

  return {
    player,
    deviceId,
    audio,
    usingPreview,
    playing,
    progress,
    duration,
    togglePlay,
    playFromPosition,
    seekToMs,
    resetPlaybackForTrack,
  };
};


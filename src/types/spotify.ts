export interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
  preview_url: string | null;
  external_urls: { spotify: string };
  duration_ms: number;
}

export interface LyricLine {
  time: number; // milliseconds
  text: string;
}

export interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyState | null>;
  addListener: (event: string, callback: (state: unknown) => void) => void;
}

export interface SpotifyState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: { current_track: { id: string } };
}


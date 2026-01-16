import { useRuntimeConfig } from '../hooks/useRuntimeConfig';

// Get runtime config (falls back to compile-time env vars in development)
const { config } = useRuntimeConfig();

export const CLIENT_ID = config?.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58';
export const REDIRECT_URI = window.location.origin;
export const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';
export const API_URL = config?.VITE_API_URL || 'http://localhost:4001';


import { getRuntimeConfig } from '../hooks/useRuntimeConfig';

// Get runtime config (falls back to compile-time env vars in development)
const runtimeConfig = getRuntimeConfig();

export const CLIENT_ID = runtimeConfig.VITE_SPOTIFY_CLIENT_ID;
export const REDIRECT_URI = window.location.origin;
export const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';
export const API_URL = runtimeConfig.VITE_API_URL;


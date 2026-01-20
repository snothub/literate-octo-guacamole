import { getRuntimeConfig } from '../hooks/useRuntimeConfig';

export const REDIRECT_URI = window.location.origin;
export const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';

// Dynamic getters to ensure runtime config is loaded before accessing values
// These must be used instead of constants to work with runtime configuration
export const getClientId = () => {
  const config = getRuntimeConfig();
  return config.VITE_SPOTIFY_CLIENT_ID;
};

export const getApiUrl = () => {
  const config = getRuntimeConfig();
  console.log('[getApiUrl] Returning API URL:', config.VITE_API_URL);
  return config.VITE_API_URL;
};


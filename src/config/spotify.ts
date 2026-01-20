export const REDIRECT_URI = window.location.origin;
export const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';

export const getClientId = () => {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58';
};

// API URL is now empty string (relative URLs)
export const getApiUrl = () => '';


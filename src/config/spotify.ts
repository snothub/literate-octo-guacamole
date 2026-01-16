export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58';
export const REDIRECT_URI = window.location.origin;
export const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';


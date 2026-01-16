import { useEffect, useState } from 'react';
import { CLIENT_ID, REDIRECT_URI, SCOPES } from '../config/spotify';
import { base64encode, generateRandomString, sha256 } from '../utils/pkce';

type SpotifyAuthState = {
  token: string;
  refreshToken: string;
  spotifyUserId: string;
  error: string;
  setError: (value: string) => void;
  login: () => Promise<void>;
  spotifyFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

export const useSpotifyAuth = (): SpotifyAuthState => {
  const [token, setToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [spotifyUserId, setSpotifyUserId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      const codeVerifier = localStorage.getItem('code_verifier');
      window.history.replaceState(null, '', window.location.pathname);

      if (codeVerifier) {
        void exchangeCodeForToken(code, codeVerifier);
      } else {
        localStorage.removeItem('code_verifier');
        setError('Authentication failed. Please try logging in again.');
      }
    } else {
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
          void fetchSpotifyUserProfile(storedToken);
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
      setToken(data.access_token);
      localStorage.setItem('spotify_token', data.access_token);

      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      localStorage.removeItem('code_verifier');
      await fetchSpotifyUserProfile(data.access_token);
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please try logging in again.');

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

      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      return data.access_token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      setError('Session expired. Please log in again.');
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

  const spotifyFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const makeRequest = async (accessToken: string) => {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
      return fetch(url, { ...options, headers });
    };

    let response = await makeRequest(token);

    if (response.status === 401 && refreshToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      }
    }

    return response;
  };

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

  return {
    token,
    refreshToken,
    spotifyUserId,
    error,
    setError,
    login,
    spotifyFetch,
  };
};


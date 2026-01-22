interface RuntimeConfig {
  VITE_API_URL: string;
  VITE_SPOTIFY_CLIENT_ID: string;
}

export function useRuntimeConfig() {
  // No longer fetch config.json - use compile-time env vars
  const config: RuntimeConfig = {
    VITE_API_URL: '', // Empty = relative URLs
    VITE_SPOTIFY_CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58',
  };
  return { config, loading: false };
}

// Export a function to get config synchronously (for use in non-hook contexts)
export function getRuntimeConfig(): RuntimeConfig {
  return {
    VITE_API_URL: '', // Empty = relative URLs
    VITE_SPOTIFY_CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58',
  };
}

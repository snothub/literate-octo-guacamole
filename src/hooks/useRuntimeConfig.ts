import { useEffect, useState } from 'react';

interface RuntimeConfig {
  VITE_API_URL: string;
  VITE_SPOTIFY_CLIENT_ID: string;
}

let cachedConfig: RuntimeConfig | null = null;
let configPromise: Promise<RuntimeConfig> | null = null;

async function loadConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configPromise) {
    return configPromise;
  }

  configPromise = fetch('/config.json')
    .then((res) => res.json())
    .then((config) => {
      cachedConfig = config;
      return config;
    })
    .catch((error) => {
      console.error('Failed to load runtime config, using defaults:', error);
      // Fallback to defaults if config.json doesn't exist (e.g., in development)
      cachedConfig = {
        VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
        VITE_SPOTIFY_CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58',
      };
      return cachedConfig;
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

export function useRuntimeConfig() {
  const [config, setConfig] = useState<RuntimeConfig | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (!cachedConfig) {
      loadConfig().then((cfg) => {
        setConfig(cfg);
        setLoading(false);
      });
    }
  }, []);

  return { config, loading };
}

// Export a function to get config synchronously (for use in non-hook contexts)
export function getRuntimeConfig(): RuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  // Return compile-time defaults if runtime config not loaded yet
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
    VITE_SPOTIFY_CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '011c5f27eef64dd0b6f65ca673215a58',
  };
}

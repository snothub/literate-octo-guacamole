#!/bin/sh
set -e

# Generate runtime configuration file
# This allows the same Docker image to be used in different environments

# Default values if not provided
VITE_API_URL="${VITE_API_URL:-http://localhost:4000}"
VITE_SPOTIFY_CLIENT_ID="${VITE_SPOTIFY_CLIENT_ID:-011c5f27eef64dd0b6f65ca673215a58}"

echo "Generating runtime config with:"
echo "  API_URL: ${VITE_API_URL}"
echo "  SPOTIFY_CLIENT_ID: ${VITE_SPOTIFY_CLIENT_ID}"

# Create config.json that the app will fetch
cat > /usr/share/nginx/html/config.json <<EOF
{
  "VITE_API_URL": "${VITE_API_URL}",
  "VITE_SPOTIFY_CLIENT_ID": "${VITE_SPOTIFY_CLIENT_ID}"
}
EOF

# Start nginx
exec "$@"

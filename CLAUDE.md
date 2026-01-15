# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Spotify Search & Play web application built with React, TypeScript, Vite, and TailwindCSS. It allows users to authenticate with Spotify, search for tracks, and play them using either the Spotify Web Playback SDK (for Premium users) or 30-second previews (for free users).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173 by default)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Docker Commands

```bash
# Build and run with Docker Compose (serves on port 3000)
docker-compose up --build

# Stop the container
docker-compose down
```

The Docker setup uses a multi-stage build: Node.js for building, nginx:alpine for serving the production build. The Dockerfile uses `npm ci` which requires `package-lock.json` to be present - run `npm install` locally first if the lockfile is missing.

## Architecture & Key Concepts

### Authentication Flow
- Uses Spotify's OAuth 2.0 Authorization Code flow with PKCE (Proof Key for Code Exchange)
- Client ID is configured via `VITE_SPOTIFY_CLIENT_ID` environment variable (in .env file)
- PKCE flow steps:
  1. Generate random code verifier and SHA-256 code challenge
  2. Redirect to Spotify with code challenge
  3. Spotify redirects back with authorization code
  4. Exchange code for access token using code verifier
  5. Store token in localStorage for persistence
- Required scopes: `streaming user-read-email user-read-private user-modify-playback-state`
- **Important**: In Spotify Developer Dashboard, add your redirect URI (e.g., `http://localhost:5173`) to the app's "Redirect URIs" list

### Playback Architecture
The app supports two playback modes with automatic fallback:

1. **Premium Playback (via Spotify Web Playback SDK)**
   - Loads `spotify-player.js` SDK dynamically when user is authenticated
   - Creates a Spotify Player instance with device registration
   - Requires active Spotify Premium subscription
   - Controlled via `https://api.spotify.com/v1/me/player/play` endpoint

2. **Preview Playback (via HTML5 Audio)**
   - Fallback when SDK playback fails or no Premium account
   - Uses track's `preview_url` (30-second clips provided by Spotify API)
   - Controlled via native HTMLAudioElement

The app tracks playback state locally (`playing`, `usingPreview`) and coordinates between SDK and preview modes. The `togglePlay()` function intelligently routes to the correct playback method.

### State Management
All state is managed in the main App component using React hooks:
- `token`: Spotify access token for API authentication
- `player` & `deviceId`: Web Playback SDK player instance and device ID
- `selected`: Currently selected track for playback
- `playing` & `usingPreview`: Playback state flags
- `audio`: HTMLAudioElement reference for preview playback

### API Integration
- Search: `GET https://api.spotify.com/v1/search?q=<query>&type=track&limit=10`
- Playback: `PUT https://api.spotify.com/v1/me/player/play?device_id=<device_id>`
- All requests require `Authorization: Bearer <token>` header

## Configuration

### Environment Variables
- `VITE_SPOTIFY_CLIENT_ID`: Your Spotify application Client ID (required)

To get a Client ID:
1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI matching your app's origin (e.g., `http://localhost:5173` for dev)
4. Copy Client ID to `.env` file

### TypeScript Configuration
- Strict mode enabled with additional checks (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Module resolution: `bundler` (Vite-specific)
- JSX mode: `react-jsx` (automatic React 17+ JSX transform)

## File Structure
- `src/App.tsx`: Main component containing all application logic
- `src/main.tsx`: React application entry point
- `src/index.css`: TailwindCSS directives and global styles
- `index.html`: Root HTML template with `#root` div
- Vite handles bundling with React plugin and TypeScript support

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

# Stop the containers
docker-compose down

# View logs for a specific service
docker-compose logs -f api
docker-compose logs -f db
```

The Docker setup includes three services:
- **spotify-app**: Multi-stage build using Node.js for building, nginx:alpine for serving on port 3000
- **api**: Express.js backend with Prisma ORM on port 4000
- **db**: PostgreSQL 16 database on port 5432

The Dockerfile uses `npm ci` which requires `package-lock.json` to be present - run `npm install` locally first if the lockfile is missing.

The backend automatically runs database migrations on startup, so no manual database setup is required.

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
- **Spotify API**:
  - Search: `GET https://api.spotify.com/v1/search?q=<query>&type=track&limit=10`
  - Playback: `PUT https://api.spotify.com/v1/me/player/play?device_id=<device_id>`
  - All requests require `Authorization: Bearer <token>` header
- **LRCLIB API** (lyrics):
  - Endpoint: `GET https://lrclib.net/api/search?track_name=<track>&artist_name=<artist>`
  - Free API, no authentication required
  - Returns synced lyrics in LRC format with timestamps

### Lyrics Feature
The app fetches and displays synchronized lyrics from LRCLIB:
- Automatically fetches lyrics when a track is selected
- Parses LRC format (`[mm:ss.xx]Lyric text`) into timed lines
- Displays lyrics above the progress bar in play bar area
- Current line is highlighted in white/larger font as song plays
- Auto-scrolls to keep current line centered
- Shows "Loading lyrics..." during fetch
- Shows "No synced lyrics available" when lyrics aren't found
- Not all songs have synced lyrics in the LRCLIB database

### Loop Feature
Users can define and repeat specific segments of a song:
- Click start/end buttons while playing to set loop points at current position
- Drag yellow markers above progress bar to adjust loop boundaries
- Start marker cannot be dragged beyond end marker (and vice versa)
- Loop points displayed in right panel with editable time inputs (MM:SS format)
- Checkbox to enable/disable looping (off by default)
- When enabled and both points are set, playback automatically jumps from end to start
- Works with both SDK and preview playback modes

### Backend API (Cloud Sync)
The app uses a PostgreSQL backend with Express.js and Prisma ORM for cross-device data persistence:
- **Automatic feature**: Loop data syncs across devices using your Spotify account
- **No separate login**: Uses your existing Spotify authentication (OAuth)
- **Automatic persistence**: Loop points (start, end, enabled state) are saved automatically (500ms debounce)
- **Per-track storage**: Each track's loop settings are stored separately by track ID
- **User isolation**: Data is stored per Spotify user ID
- **Real-time sync**: Changes are immediately available across all logged-in devices
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **Migrations**: Automatic database schema migrations on container startup

**How it works**:
1. User authenticates with Spotify OAuth (existing flow)
2. App fetches Spotify user profile to get unique user ID
3. Loop data is saved to backend with Spotify user ID
4. On other devices, same Spotify account automatically loads saved loop data

**API Endpoints**:
- `GET /api/loop/:spotifyUserId/:trackId`: Get saved loop data for a track
- `POST /api/loop`: Save/update loop data (sends spotifyUserId, trackId, loop settings)

**Setup**: No manual setup required! The backend automatically:
1. Waits for PostgreSQL to be ready
2. Runs database migrations
3. Starts the API server on port 4000

Just run `docker-compose up --build` and everything is configured automatically.

## Configuration

### Environment Variables

**Frontend (.env)**:
- `VITE_SPOTIFY_CLIENT_ID`: Your Spotify application Client ID (required)
- `VITE_API_URL`: Backend API URL (default: `http://localhost:4000`)

**Backend (docker-compose.yml)**:
- `DATABASE_URL`: PostgreSQL connection string (auto-configured in Docker)
- `PORT`: API server port (default: 4000)

To get a Spotify Client ID:
1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI matching your app's origin (e.g., `http://localhost:5173` for dev, `http://localhost:3000` for Docker)
4. Copy Client ID to `.env` file

**Important - User Access:**
- New Spotify apps start in **Development Mode** (limited to 25 users)
- Users must be added manually in the dashboard under Settings → User Management
- Each user receives an email invitation they must accept
- For public access, submit your app for Extended Quota Mode review
- See `SPOTIFY_USERS_SETUP.md` for detailed instructions

### TypeScript Configuration
- Strict mode enabled with additional checks (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Module resolution: `bundler` (Vite-specific)
- JSX mode: `react-jsx` (automatic React 17+ JSX transform)

## File Structure

**Frontend**:
- `src/App.tsx`: Main component containing all application logic
- `src/main.tsx`: React application entry point
- `src/index.css`: TailwindCSS directives and global styles
- `index.html`: Root HTML template with `#root` div
- `Dockerfile`: Multi-stage build for frontend (Node.js → nginx)
- Vite handles bundling with React plugin and TypeScript support

**Backend**:
- `backend/index.js`: Express.js API server with loop data endpoints
- `backend/prisma/schema.prisma`: Database schema definition (LoopData model with Spotify user IDs)
- `backend/prisma/migrations/`: Database migration files (auto-applied on startup)
- `backend/Dockerfile`: Node.js container for API service
- `backend/.dockerignore`: Excludes node_modules from Docker context
- `backend/package.json`: Backend dependencies (Express, Prisma, CORS)

**Infrastructure**:
- `docker-compose.yml`: Orchestrates frontend, backend API, and PostgreSQL database
- `.env`: Environment variables for frontend (Spotify Client ID, API URL)

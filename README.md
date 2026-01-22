# 🎵 Spotify Loop Player

A beautiful, interactive web application for Spotify that lets you create and manage loops within your favorite songs. Perfect for musicians, dancers, language learners, or anyone who wants to focus on specific sections of a track.

![Spotify Loop Player](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

### 🎯 Loop Management
- **Create Multiple Loops**: Set start and end points for any section of a song
- **Visual Loop Editor**: Interactive progress bar with draggable loop markers
- **Named Loops**: Label each loop for easy identification (e.g., "Chorus", "Solo", "Verse 2")
- **Loop Navigation**: Quickly switch between loops using keyboard shortcuts
- **Persistent Storage**: Your loops are saved per track and persist across sessions

### 🎹 Keyboard Shortcuts
- `Space` - Play/Pause
- `S` - Set loop start point at current position
- `E` - Set loop end point at current position
- `L` - Toggle loop on/off
- `P` - Play from loop start
- `Arrow Left/Right` - Nudge loop start (50ms increments)
- `Shift + Arrow Left/Right` - Nudge loop start (250ms increments)
- `Ctrl/Cmd + Arrow Left/Right` - Nudge loop end (50ms increments)
- `Ctrl/Cmd + Shift + Arrow Left/Right` - Nudge loop end (250ms increments)
- `Alt + Arrow Left/Right` - Navigate between loops

### 🎨 Beautiful UI
- **Dynamic Backgrounds**: Album art colors extracted and applied to the UI
- **Smooth Transitions**: Elegant color transitions when changing tracks
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Lyrics Display**: Real-time synchronized lyrics (when available)
- **Recent Tracks**: Quick access to your last 10 played tracks

### 🎼 Playback Features
- **Precise Control**: Seek to any position in the track with millisecond precision
- **Visual Feedback**: Real-time progress indication and loop visualization
- **Magnifier**: Zoom in for precise loop point selection
- **Click-to-Seek**: Click anywhere on the progress bar to jump to that position
- **Drag Markers**: Drag loop start/end markers for intuitive editing

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Spotify Premium Account** (required for full playback functionality)
- **Spotify Developer Account** (free)

### Spotify App Setup

1. **Create a Spotify App**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Fill in the app name and description
   - Accept the terms of service

2. **Configure Redirect URI**:
   - In your app settings, click "Edit Settings"
   - Add `http://localhost:5173/callback` to Redirect URIs (or your deployed URL)
   - Click "Save"

3. **Get Your Credentials**:
   - Copy your **Client ID** from the app dashboard

4. **Update Configuration**:
   - Open `src/config/spotify.ts`
   - Replace the `clientId` with your Client ID

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd literate-octo-guacamole

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or with Docker directly
docker build -t spotify-loop-player .
docker run -p 8080:80 spotify-loop-player
```

The Docker container serves the app on port 8080.

## 📖 User Guide

### First Time Setup

1. **Login**: Click "Login with Spotify" and authorize the app
2. **Search**: Use the search bar to find any track
3. **Select**: Click on a track to load it

### Creating Loops

**Method 1: Keyboard Shortcuts**
1. Play the track and listen to find your desired section
2. Press `S` to set the start point
3. Press `E` to set the end point
4. Press `L` to enable looping

**Method 2: Visual Editor**
1. Click on the progress bar to set the start point
2. Drag the loop start marker (left handle)
3. Drag the loop end marker (right handle)
4. Enable looping with the toggle or `L` key

**Method 3: Manual Input**
1. Open the Loop Controls panel
2. Enter precise start/end times (MM:SS format)
3. Click "Add Loop" to save it

### Managing Multiple Loops

1. **Create**: Click "Add Loop" after setting start/end points
2. **Label**: Give each loop a descriptive name
3. **Navigate**: Use `Alt + Arrow Keys` or click on loop segments
4. **Delete**: Click the trash icon next to a loop
5. **Switch**: Click on any loop in the Loop List to jump to it

### Using Lyrics

- Lyrics load automatically when available
- Click any lyric line to jump to that timestamp
- Lyrics auto-scroll as the song plays

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── LoginScreen.tsx
│   ├── SearchPanel.tsx
│   ├── PlayBar.tsx
│   ├── LoopControlsPanel.tsx
│   ├── LoopList.tsx
│   ├── RecentTracksPane.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useSpotifyAuth.ts
│   ├── useSpotifyPlayback.ts
│   ├── useLoopControls.ts
│   ├── useProgressInteraction.ts
│   └── ...
├── utils/              # Utility functions
│   ├── colorExtractor.ts
│   ├── pkce.ts
│   └── time.ts
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── App.tsx            # Main application component
```

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Spotify Web API & Web Playback SDK
- **Authentication**: OAuth 2.0 with PKCE

## 🔒 Authentication

The app uses **OAuth 2.0 with PKCE** (Proof Key for Code Exchange) for secure authentication without requiring a client secret. This is the recommended approach for client-side applications.

### Development Mode Limitations

By default, Spotify apps are in "Development Mode" which limits usage to 25 users. See [SPOTIFY_USERS_SETUP.md](./SPOTIFY_USERS_SETUP.md) for instructions on:
- Adding users to your allowlist
- Moving to Extended Quota Mode for public access

## 🎯 Use Cases

- **Musicians**: Practice specific sections, solos, or riffs
- **Dancers**: Loop choreography sections for rehearsal
- **Language Learners**: Repeat difficult lyrics or pronunciation
- **DJs**: Identify and practice transitions
- **Music Analysis**: Study song structure and arrangements
- **Karaoke Practice**: Perfect your timing on challenging parts

## 📝 License

This project is provided as-is for educational and personal use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 💡 Tips & Tricks

1. **Fine-tuning Loops**: Use `Shift + Arrow Keys` for larger adjustments when setting loop points
2. **Quick Loop Toggle**: Press `L` to quickly enable/disable looping without changing points
3. **Precise Seeking**: Use the magnifier (appears when hovering near loop points) for pixel-perfect positioning
4. **Saved Loops**: Your loops are automatically saved per track and user, so they persist across sessions
5. **Preview Mode**: If you don't have Spotify Premium, the app will use 30-second track previews

## 🐛 Known Issues

- Lyrics may not be available for all tracks
- Preview mode (non-Premium accounts) is limited to 30-second clips
- Some tracks may not be available for playback in your region

## 📞 Support

If you encounter a **403 Forbidden** error when searching, you need to be added to the app's user allowlist. See [SPOTIFY_USERS_SETUP.md](./SPOTIFY_USERS_SETUP.md) for details.

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

**Made with ❤️ for music lovers**


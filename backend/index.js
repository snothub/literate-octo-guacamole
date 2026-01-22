const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Serve static files from public/ (built React app)
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get recent tracks
app.get('/api/recent-tracks/:spotifyUserId', async (req, res) => {
  try {
    const { spotifyUserId } = req.params;

    const recentTracks = await prisma.recentTrack.findMany({
      where: { spotifyUserId },
      orderBy: { playedAt: 'desc' },
      take: 10,
    });

    // Convert JSON trackData back to Track objects and return array
    const tracks = recentTracks.map(rt => JSON.parse(JSON.stringify(rt.trackData)));
    res.json(tracks);
  } catch (error) {
    console.error('Get recent tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// Save recent track
app.post('/api/recent-tracks', async (req, res) => {
  try {
    const { spotifyUserId, track } = req.body;

    if (!spotifyUserId || !track) {
      return res.status(400).json({ error: 'spotifyUserId and track required' });
    }

    const recentTrack = await prisma.recentTrack.upsert({
      where: {
        spotifyUserId_trackId: {
          spotifyUserId,
          trackId: track.id,
        },
      },
      update: {
        trackData: track,
        playedAt: new Date(),
      },
      create: {
        spotifyUserId,
        trackId: track.id,
        trackData: track,
      },
    });

    res.json(recentTrack);
  } catch (error) {
    console.error('Save recent track error:', error);
    res.status(500).json({ error: 'Failed to save recent track' });
  }
});

// Get loop data for a track
app.get('/api/loop/:spotifyUserId/:trackId', async (req, res) => {
  try {
    const { spotifyUserId, trackId } = req.params;

    const loopData = await prisma.loopData.findUnique({
      where: {
        spotifyUserId_trackId: {
          spotifyUserId,
          trackId,
        },
      },
    });

    res.json(loopData || null);
  } catch (error) {
    console.error('Get loop data error:', error);
    res.status(500).json({ error: 'Failed to fetch loop data' });
  }
});

// Save/update loop data
app.post('/api/loop', async (req, res) => {
  try {
    const { spotifyUserId, trackId, segments, activeLoopId, loopStart, loopEnd, loopEnabled } = req.body;

    if (!spotifyUserId || !trackId) {
      return res.status(400).json({ error: 'spotifyUserId and trackId required' });
    }

    const loopData = await prisma.loopData.upsert({
      where: {
        spotifyUserId_trackId: {
          spotifyUserId,
          trackId,
        },
      },
      update: {
        // Support both new format (segments) and old format (loopStart, loopEnd, loopEnabled)
        ...(segments !== undefined && { segments }),
        ...(activeLoopId !== undefined && { activeLoopId }),
        ...(loopStart !== undefined && { loopStart }),
        ...(loopEnd !== undefined && { loopEnd }),
        ...(loopEnabled !== undefined && { loopEnabled }),
      },
      create: {
        spotifyUserId,
        trackId,
        ...(segments !== undefined && { segments }),
        ...(activeLoopId !== undefined && { activeLoopId }),
        ...(loopStart !== undefined && { loopStart }),
        ...(loopEnd !== undefined && { loopEnd }),
        ...(loopEnabled !== undefined && { loopEnabled }),
      },
    });

    res.json(loopData);
  } catch (error) {
    console.error('Save loop data error:', error);
    res.status(500).json({ error: 'Failed to save loop data' });
  }
});

// SPA fallback - serve index.html for all non-API routes
// MUST come after API routes and static middleware
// Only serve index.html for routes that don't look like files (no extension)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Skip requests for files with extensions (CSS, JS, images, etc.)
  if (path.extname(req.path)) {
    return next();
  }

  // Serve index.html for all other GET requests (SPA routes)
  if (req.method === 'GET') {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// Start server
async function main() {
  try {
    // Run migrations
    const { execSync } = require('child_process');
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✓ Migrations complete');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ API server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

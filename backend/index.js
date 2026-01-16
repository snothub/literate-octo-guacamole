const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
    const { spotifyUserId, trackId, loopStart, loopEnd, loopEnabled } = req.body;

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
        loopStart,
        loopEnd,
        loopEnabled,
      },
      create: {
        spotifyUserId,
        trackId,
        loopStart,
        loopEnd,
        loopEnabled,
      },
    });

    res.json(loopData);
  } catch (error) {
    console.error('Save loop data error:', error);
    res.status(500).json({ error: 'Failed to save loop data' });
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

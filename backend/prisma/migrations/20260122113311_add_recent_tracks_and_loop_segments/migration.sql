-- AlterTable
ALTER TABLE "loop_data" ADD COLUMN     "activeLoopId" TEXT,
ADD COLUMN     "segments" JSONB;

-- CreateTable
CREATE TABLE "recent_tracks" (
    "id" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "trackData" JSONB NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recent_tracks_spotifyUserId_playedAt_idx" ON "recent_tracks"("spotifyUserId", "playedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "recent_tracks_spotifyUserId_trackId_key" ON "recent_tracks"("spotifyUserId", "trackId");

-- DropForeignKey
ALTER TABLE "loop_data" DROP CONSTRAINT "loop_data_userId_fkey";

-- DropIndex
DROP INDEX "loop_data_userId_trackId_key";

-- AlterTable
ALTER TABLE "loop_data" RENAME COLUMN "userId" TO "spotifyUserId";

-- DropTable
DROP TABLE "users";

-- CreateIndex
CREATE UNIQUE INDEX "loop_data_spotifyUserId_trackId_key" ON "loop_data"("spotifyUserId", "trackId");

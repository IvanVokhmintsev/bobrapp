-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('solo', 'band');

-- AlterTable
ALTER TABLE "MusicianProfile" ADD COLUMN "profileType" "ProfileType" NOT NULL DEFAULT 'solo';
ALTER TABLE "MusicianProfile" ADD COLUMN "memberNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

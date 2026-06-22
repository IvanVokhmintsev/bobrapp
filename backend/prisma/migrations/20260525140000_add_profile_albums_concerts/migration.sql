-- CreateTable
CREATE TABLE "ProfileAlbum" (
    "id" TEXT NOT NULL,
    "musicianProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileConcert" (
    "id" TEXT NOT NULL,
    "musicianProfileId" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileConcert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileAlbum_musicianProfileId_sortOrder_idx" ON "ProfileAlbum"("musicianProfileId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProfileConcert_musicianProfileId_sortOrder_idx" ON "ProfileConcert"("musicianProfileId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProfileAlbum" ADD CONSTRAINT "ProfileAlbum_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileConcert" ADD CONSTRAINT "ProfileConcert_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "RoadmapLevel" (
    "id" TEXT NOT NULL,
    "mapNodeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapLevel_mapNodeId_key" ON "RoadmapLevel"("mapNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapLevel_order_key" ON "RoadmapLevel"("order");

-- AlterTable
ALTER TABLE "RoadmapStep" ADD COLUMN "levelId" TEXT;

-- CreateIndex
CREATE INDEX "RoadmapStep_levelId_idx" ON "RoadmapStep"("levelId");

-- AddForeignKey
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "RoadmapLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

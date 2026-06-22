-- CreateEnum
CREATE TYPE "CollaborationProposalStatus" AS ENUM ('pending', 'read', 'archived');

-- AlterTable
ALTER TABLE "MusicianProfile" ADD COLUMN "acceptsProposals" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CollaborationProposal" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "status" "CollaborationProposalStatus" NOT NULL DEFAULT 'pending',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollaborationProposal_recipientId_createdAt_idx" ON "CollaborationProposal"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "CollaborationProposal_senderId_createdAt_idx" ON "CollaborationProposal"("senderId", "createdAt");

-- AddForeignKey
ALTER TABLE "CollaborationProposal" ADD CONSTRAINT "CollaborationProposal_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationProposal" ADD CONSTRAINT "CollaborationProposal_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

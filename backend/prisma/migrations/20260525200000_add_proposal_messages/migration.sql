-- AlterTable
ALTER TABLE "CollaborationProposal" ADD COLUMN "lastMessageAt" TIMESTAMP(3),
ADD COLUMN "lastMessageAuthorId" TEXT,
ADD COLUMN "lastReadBySenderAt" TIMESTAMP(3),
ADD COLUMN "lastReadByRecipientAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProposalMessage" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalMessage_proposalId_createdAt_idx" ON "ProposalMessage"("proposalId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProposalMessage" ADD CONSTRAINT "ProposalMessage_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "CollaborationProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalMessage" ADD CONSTRAINT "ProposalMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill initial messages from existing proposals
INSERT INTO "ProposalMessage" ("id", "proposalId", "authorId", "text", "createdAt")
SELECT
    "id" || '-initial',
    "id",
    "senderId",
    "message",
    "createdAt"
FROM "CollaborationProposal";

UPDATE "CollaborationProposal"
SET
    "lastMessageAt" = "createdAt",
    "lastMessageAuthorId" = "senderId",
    "lastReadByRecipientAt" = CASE WHEN "status" = 'read' THEN "readAt" ELSE NULL END;

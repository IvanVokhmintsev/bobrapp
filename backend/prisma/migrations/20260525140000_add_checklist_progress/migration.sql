-- AlterTable
ALTER TABLE "UserRoadmapProgress" ADD COLUMN "checklistChecked" JSONB NOT NULL DEFAULT '[]';

import { prisma } from "../../lib/prisma.js";

type RoadmapStepStatus = "locked" | "available" | "completed";

export async function ensureUserRoadmapProgress(userId: string) {
  const steps = await prisma.roadmapStep.findMany({
    orderBy: {
      order: "asc",
    },
  });

  if (steps.length === 0) {
    return [];
  }

  const existingProgress = await prisma.userRoadmapProgress.findMany({
    where: {
      userId,
    },
    select: {
      stepId: true,
    },
  });

  const existingStepIds = new Set(
    existingProgress.map((progress) => progress.stepId),
  );

  const missingProgress: Array<{
    userId: string;
    stepId: string;
    status: RoadmapStepStatus;
  }> = steps
    .filter((step) => !existingStepIds.has(step.id))
    .map((step, index) => ({
      userId,
      stepId: step.id,
      status:
        index === 0 && existingProgress.length === 0 ? "available" : "locked",
    }));

  if (missingProgress.length > 0) {
    await prisma.userRoadmapProgress.createMany({
      data: missingProgress,
      skipDuplicates: true,
    });
  }

  return steps;
}

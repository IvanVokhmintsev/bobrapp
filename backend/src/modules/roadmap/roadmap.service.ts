import { prisma } from "../../lib/prisma.js";

type RoadmapStepStatus = "locked" | "available" | "completed";

export type RoadmapQuizQuestion = {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
};

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

export function readRoadmapQuiz(value: unknown): RoadmapQuizQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((question): question is RoadmapQuizQuestion => {
    if (typeof question !== "object" || question === null) {
      return false;
    }

    const item = question as Partial<RoadmapQuizQuestion>;

    return (
      typeof item.id === "string" &&
      typeof item.question === "string" &&
      typeof item.correctOptionId === "string" &&
      Array.isArray(item.options)
    );
  });
}

export async function completeRoadmapStep(userId: string, stepId: string) {
  const step = await prisma.roadmapStep.findUnique({
    where: {
      id: stepId,
    },
  });

  if (!step) {
    return {
      status: "not_found" as const,
      steps: [],
    };
  }

  const currentProgress = await prisma.userRoadmapProgress.findUnique({
    where: {
      userId_stepId: {
        userId,
        stepId: step.id,
      },
    },
  });

  if (!currentProgress || currentProgress.status === "locked") {
    return {
      status: "locked" as const,
      steps: [],
    };
  }

  await prisma.userRoadmapProgress.update({
    where: {
      userId_stepId: {
        userId,
        stepId: step.id,
      },
    },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  const nextStep = await prisma.roadmapStep.findFirst({
    where: {
      order: {
        gt: step.order,
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  if (nextStep) {
    await prisma.userRoadmapProgress.update({
      where: {
        userId_stepId: {
          userId,
          stepId: nextStep.id,
        },
      },
      data: {
        status: "available",
      },
    });
  }

  const steps = await prisma.roadmapStep.findMany({
    orderBy: {
      order: "asc",
    },
    include: {
      userProgress: {
        where: {
          userId,
        },
        select: {
          status: true,
          completedAt: true,
        },
      },
    },
  });

  return {
    status: "completed" as const,
    steps,
  };
}

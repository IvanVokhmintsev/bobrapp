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
  }> = [];

  if (existingProgress.length === 0) {
    for (const step of steps) {
      if (existingStepIds.has(step.id)) {
        continue;
      }

      missingProgress.push({
        userId,
        stepId: step.id,
        status: step.order === 1 ? "available" : "locked",
      });
    }
  } else {
    const progressWithSteps = await prisma.userRoadmapProgress.findMany({
      where: { userId },
      include: { step: { select: { order: true } } },
    });

    const maxCompletedOrder = progressWithSteps
      .filter((item) => item.status === "completed")
      .reduce((max, item) => Math.max(max, item.step.order), 0);

    for (const step of steps) {
      if (existingStepIds.has(step.id)) {
        continue;
      }

      let status: RoadmapStepStatus = "locked";

      if (maxCompletedOrder === 0) {
        status = step.order === 1 ? "available" : "locked";
      } else if (step.order <= maxCompletedOrder) {
        status = "completed";
      } else if (step.order === maxCompletedOrder + 1) {
        status = "available";
      }

      missingProgress.push({
        userId,
        stepId: step.id,
        status,
      });
    }
  }

  if (missingProgress.length > 0) {
    await prisma.userRoadmapProgress.createMany({
      data: missingProgress,
      skipDuplicates: true,
    });
  }

  await reconcileRoadmapProgress(userId);

  return steps;
}

export async function reconcileRoadmapProgress(userId: string) {
  const steps = await prisma.roadmapStep.findMany({
    orderBy: { order: "asc" },
  });

  if (steps.length === 0) {
    return;
  }

  const progress = await prisma.userRoadmapProgress.findMany({
    where: { userId },
    include: {
      step: {
        select: { order: true },
      },
    },
  });

  if (progress.length === 0) {
    return;
  }

  if (progress.some((item) => item.status === "available")) {
    return;
  }

  if (progress.every((item) => item.status === "completed")) {
    return;
  }

  const progressByStepId = new Map(progress.map((item) => [item.stepId, item]));

  for (const step of steps) {
    const item = progressByStepId.get(step.id);

    if (!item || item.status !== "locked") {
      continue;
    }

    const previousSteps = steps.filter((candidate) => candidate.order < step.order);
    const allPreviousCompleted =
      previousSteps.length === 0 ||
      previousSteps.every((candidate) => {
        const previous = progressByStepId.get(candidate.id);
        return previous?.status === "completed";
      });

    if (allPreviousCompleted) {
      await prisma.userRoadmapProgress.update({
        where: {
          userId_stepId: {
            userId,
            stepId: step.id,
          },
        },
        data: {
          status: "available",
        },
      });
      break;
    }
  }
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

export async function updateChecklistProgress(
  userId: string,
  stepId: string,
  checkedIndices: number[],
) {
  const step = await prisma.roadmapStep.findUnique({
    where: {
      id: stepId,
    },
  });

  if (!step) {
    return {
      status: "not_found" as const,
      step: null,
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
      step: null,
    };
  }

  const checklist = readChecklistItems(step.checklist);
  const normalizedIndices = [
    ...new Set(
      checkedIndices.filter(
        (index) => Number.isInteger(index) && index >= 0 && index < checklist.length,
      ),
    ),
  ].sort((left, right) => left - right);

  await prisma.userRoadmapProgress.update({
    where: {
      userId_stepId: {
        userId,
        stepId: step.id,
      },
    },
    data: {
      checklistChecked: normalizedIndices,
    },
  });

  const updatedStep = await prisma.roadmapStep.findUnique({
    where: {
      id: stepId,
    },
    include: {
      userProgress: {
        where: {
          userId,
        },
        select: {
          status: true,
          completedAt: true,
          checklistChecked: true,
        },
      },
    },
  });

  return {
    status: "updated" as const,
    step: updatedStep,
  };
}

function readChecklistItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
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

  if (currentProgress.status !== "completed") {
    const totalSteps = await prisma.roadmapStep.count();

    await prisma.$transaction(async (transaction) => {
      await transaction.userRoadmapProgress.update({
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

      if (nextStep) {
        await transaction.userRoadmapProgress.update({
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

      const completedCount = await transaction.userRoadmapProgress.count({
        where: {
          userId,
          status: "completed",
        },
      });

      const roadmapProgress =
        totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

      await transaction.musicianProfile.upsert({
        where: {
          userId,
        },
        create: {
          userId,
          points: step.pointsReward,
          roadmapProgress,
        },
        update: {
          points: {
            increment: step.pointsReward,
          },
          roadmapProgress,
        },
      });

      await transaction.achievement.create({
        data: {
          userId,
          title: `Пройден этап "${step.title}"`,
          description: step.description,
          type: "roadmap",
        },
      });

      await transaction.post.create({
        data: {
          authorId: userId,
          text: `Я прошел этап roadmap: ${step.title}`,
          type: "roadmap",
        },
      });
    });
  } else if (nextStep) {
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
          checklistChecked: true,
        },
      },
    },
  });

  return {
    status: "completed" as const,
    steps,
  };
}

type RoadmapStepWithProgress = {
  id: string;
  title: string;
  description: string;
  order: number;
  content: string;
  checklist: unknown;
  quiz: unknown;
  pointsReward: number;
  levelId: string;
  level?: {
    id: string;
    mapNodeId: number;
    title: string;
    order: number;
  };
  userProgress: Array<{
    status: "locked" | "available" | "completed";
    completedAt: Date | null;
    checklistChecked: unknown;
  }>;
};

type RoadmapLevelWithSteps = {
  id: string;
  mapNodeId: number;
  title: string;
  order: number;
  steps: RoadmapStepWithProgress[];
};

export type RoadmapLevelStatus = "completed" | "current" | "locked";

function readChecklist(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readChecklistChecked(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
}

export function computeLevelStatus(
  steps: Array<{ status: "locked" | "available" | "completed" }>,
): RoadmapLevelStatus {
  if (steps.length === 0) {
    return "locked";
  }

  if (steps.every((step) => step.status === "completed")) {
    return "completed";
  }

  if (steps.some((step) => step.status === "available")) {
    return "current";
  }

  if (steps.some((step) => step.status === "completed")) {
    return "current";
  }

  return "locked";
}

export function toPublicRoadmapStep(step: RoadmapStepWithProgress) {
  const progress = step.userProgress[0];
  const checklist = readChecklist(step.checklist);
  const checklistChecked = readChecklistChecked(progress?.checklistChecked);

  return {
    id: step.id,
    levelId: step.levelId,
    mapNodeId: step.level?.mapNodeId ?? null,
    title: step.title,
    description: step.description,
    order: step.order,
    status: progress?.status ?? "locked",
    completedAt: progress?.completedAt?.toISOString() ?? null,
    pointsReward: step.pointsReward,
    checkpoints: checklist.map((label, index) => ({
      index,
      label,
      completed: checklistChecked.includes(index),
    })),
    materialTitle: step.title,
  };
}

export function toPublicRoadmapLesson(step: RoadmapStepWithProgress) {
  const publicStep = toPublicRoadmapStep(step);

  return {
    ...publicStep,
    content: step.content,
    checklist: readChecklist(step.checklist),
    checklistChecked: readChecklistChecked(step.userProgress[0]?.checklistChecked),
  };
}

export function toPublicRoadmapLevel(level: RoadmapLevelWithSteps) {
  const milestones = level.steps
    .sort((left, right) => left.order - right.order)
    .map(toPublicRoadmapStep);

  return {
    id: level.id,
    mapNodeId: level.mapNodeId,
    title: level.title,
    order: level.order,
    status: computeLevelStatus(milestones),
    milestones,
  };
}

export function toPublicRoadmapResponse(
  levels: RoadmapLevelWithSteps[],
) {
  const publicLevels = levels
    .sort((left, right) => left.order - right.order)
    .map(toPublicRoadmapLevel);

  const steps = publicLevels.flatMap((level) => level.milestones);

  return {
    levels: publicLevels,
    steps,
  };
}

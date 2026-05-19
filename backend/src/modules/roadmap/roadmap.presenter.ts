type RoadmapStepWithProgress = {
  id: string;
  title: string;
  description: string;
  order: number;
  content: string;
  checklist: unknown;
  pointsReward: number;
  userProgress: Array<{
    status: "locked" | "available" | "completed";
    completedAt: Date | null;
  }>;
};

export function toPublicRoadmapStep(step: RoadmapStepWithProgress) {
  const progress = step.userProgress[0];

  return {
    id: step.id,
    title: step.title,
    description: step.description,
    order: step.order,
    status: progress?.status ?? "locked",
    completedAt: progress?.completedAt?.toISOString() ?? null,
    pointsReward: step.pointsReward,
  };
}

export function toPublicRoadmapLesson(step: RoadmapStepWithProgress) {
  return {
    ...toPublicRoadmapStep(step),
    content: step.content,
    checklist: step.checklist,
  };
}

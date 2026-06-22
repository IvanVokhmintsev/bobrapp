import type { RoadmapStep } from "../api";

/** Maps seed step order (1…8) to Figma map level nodes (7…3). */
export function stepOrderToLevel(order: number): number {
  return Math.max(3, 7 - Math.min(4, Math.floor(((order - 1) * 5) / 8)));
}

export function getCurrentStep(steps: RoadmapStep[]): RoadmapStep | null {
  return steps.find((step) => step.status === "available") ?? null;
}

export type RoadmapLevelStatus = "completed" | "current" | "locked";

export function getLevelStatus(
  level: number,
  steps: RoadmapStep[],
): RoadmapLevelStatus {
  const levelSteps = steps.filter((step) => stepOrderToLevel(step.order) === level);

  if (levelSteps.length === 0) {
    return "locked";
  }

  if (levelSteps.every((step) => step.status === "completed")) {
    return "completed";
  }

  if (levelSteps.some((step) => step.status === "available")) {
    return "current";
  }

  if (levelSteps.some((step) => step.status === "completed")) {
    return "completed";
  }

  return "locked";
}

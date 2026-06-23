import type { RoadmapLevel, RoadmapMilestone } from "../api";

export type RoadmapLevelStatus = RoadmapLevel["status"];

/** @deprecated Prefer level.mapNodeId from API */
export function stepOrderToLevel(order: number): number {
  if (order <= 2) {
    return 7;
  }

  if (order <= 4) {
    return 6;
  }

  if (order <= 6) {
    return 5;
  }

  if (order === 7) {
    return 4;
  }

  return 3;
}

export function getCurrentLevel(levels: RoadmapLevel[]): RoadmapLevel | null {
  return levels.find((level) => level.status === "current") ?? null;
}

export function getCurrentMilestone(levels: RoadmapLevel[]): RoadmapMilestone | null {
  for (const level of levels) {
    const milestone = level.milestones.find((item) => item.status === "available");

    if (milestone) {
      return milestone;
    }
  }

  return null;
}

export function getLevelByMapNode(
  levels: RoadmapLevel[],
  mapNodeId: number,
): RoadmapLevel | null {
  return levels.find((level) => level.mapNodeId === mapNodeId) ?? null;
}

export function isLevelSelectable(level: RoadmapLevel) {
  return level.status === "completed" || level.status === "current";
}

/** @deprecated Use getCurrentMilestone */
export function getCurrentStep(milestones: RoadmapMilestone[]): RoadmapMilestone | null {
  return milestones.find((milestone) => milestone.status === "available") ?? null;
}

/** @deprecated Use level.status from API */
export function getLevelStatus(
  mapNodeId: number,
  levels: RoadmapLevel[],
): RoadmapLevelStatus {
  return getLevelByMapNode(levels, mapNodeId)?.status ?? "locked";
}

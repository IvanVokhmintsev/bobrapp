import type { ApiUser } from "../api";

const MIN_LEVEL = 1;
const MAX_LEVEL = 9;
const POINTS_PER_LEVEL = 15;

export function getMusicianLevel(points: number | null | undefined): number {
  if (points == null || points < 0) {
    return MIN_LEVEL;
  }

  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(points / POINTS_PER_LEVEL) + 1));
}

export function getMusicianLevelFromUser(user: Pick<ApiUser, "musicianProfile">): number {
  return getMusicianLevel(user.musicianProfile?.points);
}

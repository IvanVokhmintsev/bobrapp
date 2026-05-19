type PublicMusicianProfile = {
  id: string;
  level: "nothing" | "beginner" | "advanced" | "professional" | null;
  bio: string | null;
  avatarUrl: string | null;
  points: number;
  roadmapProgress: number;
};

type UserWithProfile = {
  id: string;
  name: string;
  email: string;
  role: "musician" | "label";
  createdAt: Date;
  updatedAt: Date;
  musicianProfile?: PublicMusicianProfile | null;
};

export function toPublicUser(user: UserWithProfile) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    musicianProfile: user.musicianProfile
      ? {
          id: user.musicianProfile.id,
          level: user.musicianProfile.level,
          bio: user.musicianProfile.bio,
          avatarUrl: user.musicianProfile.avatarUrl,
          points: user.musicianProfile.points,
          roadmapProgress: user.musicianProfile.roadmapProgress,
        }
      : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

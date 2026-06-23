import type { Prisma } from "@prisma/client";

import { parseMembersJson } from "../profile/profileMembers.js";

type DbMusicianProfile = {
  id: string;
  profileType: "solo" | "band";
  level: "nothing" | "beginner" | "advanced" | "professional" | null;
  bio: string | null;
  avatarUrl: string | null;
  location?: string | null;
  genres?: string[];
  instruments?: string[];
  daw?: string[];
  memberNames?: string[];
  members?: Prisma.JsonValue;
  socialLinks?: unknown;
  acceptsProposals?: boolean;
  points: number;
  roadmapProgress: number;
};

type PublicLabelProfile = {
  id: string;
  companyName: string;
  description: string | null;
  genres: string[];
  onboardedAt: Date | null;
};

type PublicAchievement = {
  id: string;
  title: string;
  description: string | null;
  type: "roadmap" | "professional";
  createdAt: Date;
};

type UserWithProfile = {
  id: string;
  name: string;
  email: string;
  role: "musician" | "label";
  createdAt: Date;
  updatedAt: Date;
  musicianProfile?: DbMusicianProfile | null;
  labelProfile?: PublicLabelProfile | null;
  achievements?: PublicAchievement[];
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
          profileType: user.musicianProfile.profileType,
          level: user.musicianProfile.level,
          bio: user.musicianProfile.bio,
          avatarUrl: user.musicianProfile.avatarUrl,
          location: user.musicianProfile.location ?? null,
          genres: user.musicianProfile.genres ?? [],
          instruments: user.musicianProfile.instruments ?? [],
          daw: user.musicianProfile.daw ?? [],
          memberNames: user.musicianProfile.memberNames ?? [],
          members: parseMembersJson(
            user.musicianProfile.members,
            user.musicianProfile.memberNames ?? [],
          ),
          socialLinks: user.musicianProfile.socialLinks ?? {},
          acceptsProposals: user.musicianProfile.acceptsProposals ?? true,
          points: user.musicianProfile.points,
          roadmapProgress: user.musicianProfile.roadmapProgress,
        }
      : null,
    labelProfile: user.labelProfile
      ? {
          id: user.labelProfile.id,
          companyName: user.labelProfile.companyName,
          description: user.labelProfile.description,
          genres: user.labelProfile.genres ?? [],
          onboardedAt: user.labelProfile.onboardedAt?.toISOString() ?? null,
        }
      : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    achievements: user.achievements
      ? user.achievements.map((achievement) => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          createdAt: achievement.createdAt.toISOString(),
        }))
      : [],
  };
}

import type { Prisma } from "@prisma/client";

import { toPublicUser } from "../users/user.presenter.js";

export const profileInclude = {
  musicianProfile: true,
  achievements: {
    orderBy: {
      createdAt: "desc",
    },
  },
  _count: {
    select: {
      followers: true,
      following: true,
    },
  },
} as const;

export type ProfileUser = Prisma.UserGetPayload<{
  include: typeof profileInclude;
}>;

export type ProfileViewerFlags = {
  followingByMe?: boolean;
  favoritedByMe?: boolean;
};

export function toProfileResponse(
  user: ProfileUser,
  flags: ProfileViewerFlags = {},
) {
  return {
    ...toPublicUser(user),
    followersCount: user._count.followers,
    followingCount: user._count.following,
    followingByMe: flags.followingByMe ?? false,
    favoritedByMe: flags.favoritedByMe ?? false,
  };
}

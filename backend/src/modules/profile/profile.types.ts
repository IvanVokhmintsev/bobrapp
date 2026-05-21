export type UpdateProfileBody = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  genres?: string[];
  instruments?: string[];
  daw?: string[];
  socialLinks?: Record<string, string>;
};

export type PublicProfileParams = {
  userId: string;
};

export type FollowsQuery = {
  cursor?: string;
  limit?: number;
};

export type PublicProfilesQuery = {
  q?: string;
  cursor?: string;
  limit?: number;
};

export type ProfilePostsQuery = {
  cursor?: string;
  limit?: number;
};

export type CreateAchievementBody = {
  title: string;
  description?: string;
};

export type UpdateAchievementBody = {
  title?: string;
  description?: string | null;
};

export type AchievementParams = {
  achievementId: string;
};

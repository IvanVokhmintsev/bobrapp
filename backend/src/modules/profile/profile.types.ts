export type UpdateProfileBody = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
};

export type PublicProfileParams = {
  userId: string;
};

export type FollowsQuery = {
  cursor?: string;
  limit?: number;
};

export type UpdateProfileBody = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
};

export type PublicProfileParams = {
  userId: string;
};

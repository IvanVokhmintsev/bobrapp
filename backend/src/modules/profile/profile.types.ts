export type ProfileType = "solo" | "band";

export type ProfileMember = {
  name: string;
  role: string;
};

export type UpdateProfileBody = {
  name?: string;
  companyName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  profileType?: ProfileType;
  genres?: string[];
  instruments?: string[];
  daw?: string[];
  memberNames?: string[];
  members?: ProfileMember[];
  socialLinks?: Record<string, string>;
  acceptsProposals?: boolean;
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
  type?: ProfileType;
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

export type CreateProfileAlbumBody = {
  title: string;
  releaseDate?: string | null;
  coverUrl?: string | null;
  sortOrder?: number;
};

export type UpdateProfileAlbumBody = {
  title?: string;
  releaseDate?: string | null;
  coverUrl?: string | null;
  sortOrder?: number;
};

export type ProfileAlbumParams = {
  albumId: string;
};

export type CreateProfileConcertBody = {
  venue: string;
  eventDate: string;
  coverUrl?: string | null;
  sortOrder?: number;
};

export type UpdateProfileConcertBody = {
  venue?: string;
  eventDate?: string;
  coverUrl?: string | null;
  sortOrder?: number;
};

export type ProfileConcertParams = {
  concertId: string;
};

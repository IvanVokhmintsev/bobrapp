export type FavoriteArtistParams = {
  userId: string;
};

export type FavoritePostParams = {
  id: string;
};

export type FavoritesQuery = {
  cursor?: string;
  limit?: number;
};

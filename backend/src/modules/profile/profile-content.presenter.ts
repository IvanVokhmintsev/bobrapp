type ProfileAlbumRecord = {
  id: string;
  title: string;
  releaseDate: Date | null;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProfileConcertRecord = {
  id: string;
  venue: string;
  eventDate: Date;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicProfileAlbum(album: ProfileAlbumRecord) {
  return {
    id: album.id,
    title: album.title,
    releaseDate: album.releaseDate
      ? album.releaseDate.toISOString().slice(0, 10)
      : null,
    coverUrl: album.coverUrl,
    sortOrder: album.sortOrder,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  };
}

export function toPublicProfileConcert(concert: ProfileConcertRecord) {
  return {
    id: concert.id,
    venue: concert.venue,
    eventDate: concert.eventDate.toISOString().slice(0, 10),
    coverUrl: concert.coverUrl,
    sortOrder: concert.sortOrder,
    createdAt: concert.createdAt.toISOString(),
    updatedAt: concert.updatedAt.toISOString(),
  };
}

export function parseOptionalDate(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value.trim() === "") {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function parseRequiredDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

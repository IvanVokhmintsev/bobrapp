export const MUSIC_GENRES = [
  "Rock",
  "Pop",
  "Hip-Hop",
  "R&B",
  "Jazz",
  "Blues",
  "Electronic",
  "House",
  "Techno",
  "Metal",
  "Punk",
  "Indie",
  "Folk",
  "Country",
  "Classical",
  "Reggae",
  "Soul",
  "Funk",
  "Диско",
  "Шансон",
  "Рэп",
  "Альтернатива",
  "Построк",
  "Поп-рок",
  "Дабстеп",
  "Акустика",
  "Лоу-фай",
  "Саундтрек",
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];

export function normalizeGenres(genres: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const genre of genres) {
    const trimmed = genre.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);

    if (result.length >= 20) {
      break;
    }
  }

  return result;
}

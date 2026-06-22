import type { ApiUser } from "../api";
import { isBandProfile } from "./profileType";

export type ProfileBlockStatus = {
  id: string;
  label: string;
  filled: boolean;
};

export function getProfileBlockStatuses(
  user: ApiUser,
  options: { postsCount: number },
): ProfileBlockStatus[] {
  const profile = user.musicianProfile;
  const band = isBandProfile(user);
  const socialLinks = profile?.socialLinks ?? {};
  const hasSocialLinks = Object.values(socialLinks).some((value) => value.trim().length > 0);

  const blocks: ProfileBlockStatus[] = [
    {
      id: "identity",
      label: band ? "Фото и название коллектива" : "Фото и имя",
      filled: Boolean(profile?.avatarUrl?.trim()) && Boolean(user.name.trim()),
    },
    {
      id: "bio",
      label: band ? "О группе" : "О себе",
      filled: Boolean(profile?.bio?.trim()),
    },
    {
      id: "social",
      label: "Ссылки на музыку",
      filled: hasSocialLinks,
    },
    {
      id: "posts",
      label: "Публикации",
      filled: options.postsCount > 0,
    },
    {
      id: "genres",
      label: "Жанры",
      filled: (profile?.genres.length ?? 0) > 0,
    },
  ];

  if (band) {
    blocks.push({
      id: "members",
      label: "Состав группы",
      filled: (profile?.memberNames.length ?? 0) > 0,
    });
  } else {
    blocks.push({
      id: "instruments",
      label: "Инструменты",
      filled: (profile?.instruments.length ?? 0) > 0,
    });
  }

  blocks.push(
    {
      id: "albums",
      label: "Альбомы",
      filled: false,
    },
    {
      id: "concerts",
      label: "Концерты",
      filled: false,
    },
  );

  return blocks;
}

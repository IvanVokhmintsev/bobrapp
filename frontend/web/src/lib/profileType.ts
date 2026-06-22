export type ProfileType = "solo" | "band";

export function getProfileType(user: {
  musicianProfile?: { profileType?: ProfileType | null } | null;
}): ProfileType {
  return user.musicianProfile?.profileType ?? "solo";
}

export function isBandProfile(user: {
  musicianProfile?: { profileType?: ProfileType | null } | null;
}): boolean {
  return getProfileType(user) === "band";
}

export function getProfileTypeLabel(type: ProfileType): string {
  return type === "band" ? "Группа" : "Соло";
}

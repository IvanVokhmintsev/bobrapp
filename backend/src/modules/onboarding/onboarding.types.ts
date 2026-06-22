export type MusicianLevel =
  | "nothing"
  | "beginner"
  | "advanced"
  | "professional";

export type ProfileType = "solo" | "band";

export type MusicianOnboardingBody = {
  level: MusicianLevel;
  profileType?: ProfileType;
  memberNames?: string[];
};

export type MusicianLevel =
  | "nothing"
  | "beginner"
  | "advanced"
  | "professional";

export type MusicianOnboardingBody = {
  level: MusicianLevel;
};

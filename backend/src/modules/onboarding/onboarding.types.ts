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
  members?: Array<{ name: string; role: string }>;
};

export type LabelOnboardingBody = {
  companyName: string;
  description?: string;
  genres?: string[];
};

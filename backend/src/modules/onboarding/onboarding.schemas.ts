export const musicianLevelSchema = {
  type: "string",
  enum: ["nothing", "beginner", "advanced", "professional"],
} as const;

export const musicianOnboardingSchema = {
  body: {
    type: "object",
    required: ["level"],
    additionalProperties: false,
    properties: {
      level: musicianLevelSchema,
    },
  },
} as const;

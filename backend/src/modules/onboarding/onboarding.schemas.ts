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
      profileType: {
        type: "string",
        enum: ["solo", "band"],
      },
      memberNames: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 80 },
      },
    },
  },
} as const;

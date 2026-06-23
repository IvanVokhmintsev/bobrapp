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
      members: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1, maxLength: 60 },
            role: { type: "string", maxLength: 60 },
          },
        },
      },
    },
  },
} as const;

export const labelOnboardingSchema = {
  body: {
    type: "object",
    required: ["companyName"],
    additionalProperties: false,
    properties: {
      companyName: { type: "string", minLength: 1, maxLength: 120 },
      description: { type: "string", maxLength: 1000 },
      genres: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 60 },
      },
    },
  },
} as const;

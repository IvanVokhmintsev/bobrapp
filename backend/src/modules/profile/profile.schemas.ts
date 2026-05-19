export const updateProfileSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100 },
      bio: { type: "string", maxLength: 1000 },
      avatarUrl: { type: "string", maxLength: 2000 },
    },
  },
} as const;

export const publicProfileSchema = {
  params: {
    type: "object",
    required: ["userId"],
    additionalProperties: false,
    properties: {
      userId: { type: "string", minLength: 1 },
    },
  },
} as const;

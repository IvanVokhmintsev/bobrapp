export const updateProfileSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100 },
      bio: { type: "string", maxLength: 1000 },
      avatarUrl: { type: "string", maxLength: 2000 },
      location: { type: "string", maxLength: 120 },
      genres: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 60 },
      },
      instruments: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 60 },
      },
      daw: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 60 },
      },
      socialLinks: {
        type: "object",
        additionalProperties: { type: "string", minLength: 1, maxLength: 500 },
        maxProperties: 20,
      },
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

export const followsQuerySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      cursor: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
} as const;

export const publicProfilesQuerySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      q: { type: "string", minLength: 1, maxLength: 100 },
      cursor: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
} as const;

export const profilePostsQuerySchema = followsQuerySchema;

export const createAchievementSchema = {
  body: {
    type: "object",
    required: ["title"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1, maxLength: 120 },
      description: { type: "string", maxLength: 1000 },
    },
  },
} as const;

export const achievementParamsSchema = {
  params: {
    type: "object",
    required: ["achievementId"],
    additionalProperties: false,
    properties: {
      achievementId: { type: "string", minLength: 1 },
    },
  },
} as const;

export const updateAchievementSchema = {
  params: achievementParamsSchema.params,
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1, maxLength: 120 },
      description: {
        anyOf: [
          { type: "string", maxLength: 1000 },
          { type: "null" },
        ],
      },
    },
  },
} as const;

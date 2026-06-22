export const favoriteArtistParamsSchema = {
  params: {
    type: "object",
    required: ["userId"],
    additionalProperties: false,
    properties: {
      userId: { type: "string", minLength: 1 },
    },
  },
} as const;

export const favoritePostParamsSchema = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
} as const;

export const favoritesQuerySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      cursor: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
} as const;

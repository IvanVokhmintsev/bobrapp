export const postTypeSchema = {
  type: "string",
  enum: ["professional", "roadmap"],
} as const;

export const createPostSchema = {
  body: {
    type: "object",
    required: ["text", "type"],
    additionalProperties: false,
    properties: {
      text: { type: "string", minLength: 1, maxLength: 2000 },
      type: postTypeSchema,
    },
  },
} as const;

export const likePostSchema = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
} as const;

export const postIdParamsSchema = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
} as const;

export const commentPostSchema = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
  body: {
    type: "object",
    required: ["text"],
    additionalProperties: false,
    properties: {
      text: { type: "string", minLength: 1, maxLength: 1000 },
    },
  },
} as const;

export const commentParamsSchema = {
  params: {
    type: "object",
    required: ["id", "commentId"],
    additionalProperties: false,
    properties: {
      id: { type: "string", minLength: 1 },
      commentId: { type: "string", minLength: 1 },
    },
  },
} as const;

export const feedQuerySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      cursor: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
      type: postTypeSchema,
    },
  },
} as const;

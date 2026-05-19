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
  body: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
} as const;

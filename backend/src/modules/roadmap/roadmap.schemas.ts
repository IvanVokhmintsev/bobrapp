export const roadmapStepParamsSchema = {
  params: {
    type: "object",
    required: ["stepId"],
    additionalProperties: false,
    properties: {
      stepId: { type: "string", minLength: 1 },
    },
  },
} as const;

export const roadmapQuizSchema = {
  ...roadmapStepParamsSchema,
  body: {
    type: "object",
    required: ["answers"],
    additionalProperties: false,
    properties: {
      answers: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["questionId", "optionId"],
          additionalProperties: false,
          properties: {
            questionId: { type: "string", minLength: 1 },
            optionId: { type: "string", minLength: 1 },
          },
        },
      },
    },
  },
} as const;

export const roadmapChecklistSchema = {
  ...roadmapStepParamsSchema,
  body: {
    type: "object",
    required: ["checkedIndices"],
    additionalProperties: false,
    properties: {
      checkedIndices: {
        type: "array",
        items: {
          type: "integer",
          minimum: 0,
        },
      },
    },
  },
} as const;

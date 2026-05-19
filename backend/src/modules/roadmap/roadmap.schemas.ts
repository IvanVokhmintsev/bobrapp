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

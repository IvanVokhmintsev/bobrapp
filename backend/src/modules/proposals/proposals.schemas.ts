export const sendProposalSchema = {
  params: {
    type: "object",
    required: ["userId"],
    additionalProperties: false,
    properties: {
      userId: { type: "string", minLength: 1 },
    },
  },
  body: {
    type: "object",
    required: ["subject", "message"],
    additionalProperties: false,
    properties: {
      subject: { type: "string", minLength: 1, maxLength: 120 },
      message: { type: "string", minLength: 1, maxLength: 2000 },
      linkUrl: { type: "string", maxLength: 500 },
    },
  },
} as const;

export const proposalParamsSchema = {
  params: {
    type: "object",
    required: ["proposalId"],
    additionalProperties: false,
    properties: {
      proposalId: { type: "string", minLength: 1 },
    },
  },
} as const;

export const sendProposalMessageSchema = {
  params: proposalParamsSchema.params,
  body: {
    type: "object",
    required: ["text"],
    additionalProperties: false,
    properties: {
      text: { type: "string", minLength: 1, maxLength: 2000 },
    },
  },
} as const;

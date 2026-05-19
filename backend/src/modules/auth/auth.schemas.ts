export const userRoleSchema = {
  type: "string",
  enum: ["musician", "label"],
} as const;

export const registerSchema = {
  body: {
    type: "object",
    required: ["name", "email", "password", "role"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      role: userRoleSchema,
    },
  },
} as const;

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
  },
} as const;

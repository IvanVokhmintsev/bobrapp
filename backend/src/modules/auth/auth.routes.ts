import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "./auth.middleware.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import type { LoginBody, RegisterBody } from "./auth.types.js";

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: "musician" | "label";
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>(
    "/auth/register",
    { schema: registerSchema },
    async (request, reply) => {
      const { name, email, password, role } = request.body;
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return reply.status(409).send({
          error: "Email is already registered",
          statusCode: 409,
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role,
          musicianProfile:
            role === "musician"
              ? {
                  create: {},
                }
              : undefined,
        },
      });

      const token = app.jwt.sign({
        userId: user.id,
        role: user.role,
      });

      return reply.status(201).send({
        token,
        user: toPublicUser(user),
      });
    },
  );

  app.post<{ Body: LoginBody }>(
    "/auth/login",
    { schema: loginSchema },
    async (request, reply) => {
      const { email, password } = request.body;
      const normalizedEmail = email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return reply.status(401).send({
          error: "Invalid email or password",
          statusCode: 401,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return reply.status(401).send({
          error: "Invalid email or password",
          statusCode: 401,
        });
      }

      const token = app.jwt.sign({
        userId: user.id,
        role: user.role,
      });

      return reply.send({
        token,
        user: toPublicUser(user),
      });
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
      });

      if (!user) {
        return reply.status(404).send({
          error: "User not found",
          statusCode: 404,
        });
      }

      return reply.send({
        user: toPublicUser(user),
      });
    },
  );
}

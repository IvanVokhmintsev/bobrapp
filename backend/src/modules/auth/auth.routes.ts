import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { toPublicUser } from "../users/user.presenter.js";
import { authenticate } from "./auth.middleware.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { clearAuthCookie, setAuthCookie } from "./auth.session.js";
import type { LoginBody, RegisterBody } from "./auth.types.js";

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
        include: {
          musicianProfile: true,
        },
      });

      const token = app.jwt.sign({
        userId: user.id,
        role: user.role,
      });
      setAuthCookie(reply, token);

      return reply.status(201).send({
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
        include: {
          musicianProfile: true,
        },
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
      setAuthCookie(reply, token);

      return reply.send({
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
        include: {
          musicianProfile: true,
        },
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

  app.post("/auth/logout", async (request, reply) => {
    clearAuthCookie(reply);
    return reply.status(204).send();
  });
}

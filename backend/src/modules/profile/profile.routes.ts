import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { toPublicUser } from "../users/user.presenter.js";
import { publicProfileSchema, updateProfileSchema } from "./profile.schemas.js";
import type { PublicProfileParams, UpdateProfileBody } from "./profile.types.js";

const profileInclude = {
  musicianProfile: true,
  achievements: {
    orderBy: {
      createdAt: "desc",
    },
  },
} as const;

export async function registerProfileRoutes(app: FastifyInstance) {
  app.get(
    "/profile/me",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: profileInclude,
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

  app.patch<{ Body: UpdateProfileBody }>(
    "/profile/me",
    {
      preHandler: authenticate,
      schema: updateProfileSchema,
    },
    async (request, reply) => {
      const { name, bio, avatarUrl } = request.body;

      if (
        name === undefined &&
        bio === undefined &&
        avatarUrl === undefined
      ) {
        return reply.status(400).send({
          error: "No profile fields provided",
          statusCode: 400,
        });
      }

      const user = await prisma.user.update({
        where: {
          id: request.user.userId,
        },
        data: {
          name: name?.trim(),
          musicianProfile:
            bio !== undefined || avatarUrl !== undefined
              ? {
                  upsert: {
                    create: {
                      bio: bio?.trim() ?? null,
                      avatarUrl: avatarUrl?.trim() ?? null,
                    },
                    update: {
                      bio: bio?.trim() ?? null,
                      avatarUrl: avatarUrl?.trim() ?? null,
                    },
                  },
                }
              : undefined,
        },
        include: profileInclude,
      });

      return reply.send({
        user: toPublicUser(user),
      });
    },
  );

  app.get<{ Params: PublicProfileParams }>(
    "/profiles/:userId",
    {
      preHandler: authenticate,
      schema: publicProfileSchema,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: {
          id: request.params.userId,
        },
        include: profileInclude,
      });

      if (!user) {
        return reply.status(404).send({
          error: "Profile not found",
          statusCode: 404,
        });
      }

      return reply.send({
        user: toPublicUser(user),
      });
    },
  );
}

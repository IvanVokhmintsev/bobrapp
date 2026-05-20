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
  _count: {
    select: {
      followers: true,
      following: true,
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
        user: {
          ...toPublicUser(user),
          followersCount: user._count.followers,
          followingCount: user._count.following,
        },
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
        user: {
          ...toPublicUser(user),
          followersCount: user._count.followers,
          followingCount: user._count.following,
        },
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
        user: {
          ...toPublicUser(user),
          followersCount: user._count.followers,
          followingCount: user._count.following,
        },
      });
    },
  );

  app.post<{ Params: PublicProfileParams }>(
    "/profiles/:userId/follow",
    {
      preHandler: authenticate,
      schema: publicProfileSchema,
    },
    async (request, reply) => {
      if (request.user.userId === request.params.userId) {
        return reply.status(400).send({
          error: "Cannot follow yourself",
          statusCode: 400,
        });
      }

      const target = await prisma.user.findUnique({
        where: { id: request.params.userId },
        select: { id: true, role: true },
      });

      if (!target) {
        return reply.status(404).send({
          error: "Profile not found",
          statusCode: 404,
        });
      }

      if (target.role !== "musician") {
        return reply.status(400).send({
          error: "Can only follow musicians",
          statusCode: 400,
        });
      }

      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: request.user.userId,
            followingId: request.params.userId,
          },
        },
        create: {
          followerId: request.user.userId,
          followingId: request.params.userId,
        },
        update: {},
      });

      return {
        following: true,
      };
    },
  );

  app.delete<{ Params: PublicProfileParams }>(
    "/profiles/:userId/follow",
    {
      preHandler: authenticate,
      schema: publicProfileSchema,
    },
    async (request, reply) => {
      const relation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: request.user.userId,
            followingId: request.params.userId,
          },
        },
      });

      if (relation) {
        await prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId: request.user.userId,
              followingId: request.params.userId,
            },
          },
        });
      }

      return {
        following: false,
      };
    },
  );

  app.get<{ Params: PublicProfileParams }>(
    "/profiles/:userId/follow-status",
    {
      preHandler: authenticate,
      schema: publicProfileSchema,
    },
    async (request) => {
      const relation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: request.user.userId,
            followingId: request.params.userId,
          },
        },
      });

      return {
        following: relation !== null,
      };
    },
  );
}

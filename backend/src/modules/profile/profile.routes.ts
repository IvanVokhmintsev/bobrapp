import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { toPublicUser } from "../users/user.presenter.js";
import {
  followsQuerySchema,
  publicProfileSchema,
  updateProfileSchema,
} from "./profile.schemas.js";
import type {
  FollowsQuery,
  PublicProfileParams,
  UpdateProfileBody,
} from "./profile.types.js";

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

  app.get<{ Querystring: FollowsQuery }>(
    "/profile/me/following",
    {
      preHandler: authenticate,
      schema: followsQuerySchema,
    },
    async (request) => {
      const limit = request.query.limit ?? 20;
      const cursor = request.query.cursor;

      const relations = await prisma.follow.findMany({
        where: {
          followerId: request.user.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        include: {
          following: {
            include: profileInclude,
          },
        },
        take: limit + 1,
      });

      const hasNextPage = relations.length > limit;
      const pageItems = hasNextPage ? relations.slice(0, limit) : relations;
      const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : null;

      return {
        users: pageItems.map((relation) => ({
          ...toPublicUser(relation.following),
          followersCount: relation.following._count.followers,
          followingCount: relation.following._count.following,
        })),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
    },
  );

  app.get<{ Params: PublicProfileParams; Querystring: FollowsQuery }>(
    "/profiles/:userId/followers",
    {
      preHandler: authenticate,
      schema: {
        ...publicProfileSchema,
        ...followsQuerySchema,
      },
    },
    async (request, reply) => {
      const target = await prisma.user.findUnique({
        where: { id: request.params.userId },
        select: { id: true },
      });

      if (!target) {
        return reply.status(404).send({
          error: "Profile not found",
          statusCode: 404,
        });
      }

      const limit = request.query.limit ?? 20;
      const cursor = request.query.cursor;

      const relations = await prisma.follow.findMany({
        where: {
          followingId: request.params.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        include: {
          follower: {
            include: profileInclude,
          },
        },
        take: limit + 1,
      });

      const hasNextPage = relations.length > limit;
      const pageItems = hasNextPage ? relations.slice(0, limit) : relations;
      const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : null;

      return {
        users: pageItems.map((relation) => ({
          ...toPublicUser(relation.follower),
          followersCount: relation.follower._count.followers,
          followingCount: relation.follower._count.following,
        })),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
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

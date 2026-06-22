import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { toPublicPost } from "../posts/post.presenter.js";
import { profileInclude, toProfileResponse } from "../profile/profile.presenter.js";
import {
  favoriteArtistParamsSchema,
  favoritePostParamsSchema,
  favoritesQuerySchema,
} from "./favorites.schemas.js";
import type {
  FavoriteArtistParams,
  FavoritePostParams,
  FavoritesQuery,
} from "./favorites.types.js";

const favoritePostInclude = {
  author: {
    select: {
      id: true,
      name: true,
      role: true,
      musicianProfile: {
        select: {
          avatarUrl: true,
          profileType: true,
        },
      },
    },
  },
  postLikes: {
    select: {
      userId: true,
    },
  },
  reposts: {
    select: {
      userId: true,
    },
  },
  favoritePosts: {
    select: {
      userId: true,
    },
  },
} as const;

export async function registerFavoriteRoutes(app: FastifyInstance) {
  app.post<{ Params: FavoriteArtistParams }>(
    "/profiles/:userId/favorite",
    {
      preHandler: authenticate,
      schema: favoriteArtistParamsSchema,
    },
    async (request, reply) => {
      if (request.params.userId === request.user.userId) {
        return reply.status(400).send({
          error: "Cannot favorite yourself",
          statusCode: 400,
        });
      }

      const artist = await prisma.user.findUnique({
        where: { id: request.params.userId },
        select: { id: true, role: true },
      });

      if (!artist) {
        return reply.status(404).send({
          error: "Profile not found",
          statusCode: 404,
        });
      }

      if (artist.role !== "musician") {
        return reply.status(400).send({
          error: "Can only favorite musicians",
          statusCode: 400,
        });
      }

      await prisma.favoriteArtist.upsert({
        where: {
          userId_artistId: {
            userId: request.user.userId,
            artistId: request.params.userId,
          },
        },
        create: {
          userId: request.user.userId,
          artistId: request.params.userId,
        },
        update: {},
      });

      return {
        favorited: true,
      };
    },
  );

  app.delete<{ Params: FavoriteArtistParams }>(
    "/profiles/:userId/favorite",
    {
      preHandler: authenticate,
      schema: favoriteArtistParamsSchema,
    },
    async (request) => {
      await prisma.favoriteArtist.deleteMany({
        where: {
          userId: request.user.userId,
          artistId: request.params.userId,
        },
      });

      return {
        favorited: false,
      };
    },
  );

  app.post<{ Params: FavoritePostParams }>(
    "/posts/:id/favorite",
    {
      preHandler: authenticate,
      schema: favoritePostParamsSchema,
    },
    async (request, reply) => {
      const postExists = await prisma.post.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!postExists) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      await prisma.favoritePost.upsert({
        where: {
          userId_postId: {
            userId: request.user.userId,
            postId: request.params.id,
          },
        },
        create: {
          userId: request.user.userId,
          postId: request.params.id,
        },
        update: {},
      });

      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
        include: favoritePostInclude,
      });

      if (!post) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      return {
        post: toPublicPost(post, request.user.userId),
        favorited: true,
      };
    },
  );

  app.delete<{ Params: FavoritePostParams }>(
    "/posts/:id/favorite",
    {
      preHandler: authenticate,
      schema: favoritePostParamsSchema,
    },
    async (request, reply) => {
      await prisma.favoritePost.deleteMany({
        where: {
          userId: request.user.userId,
          postId: request.params.id,
        },
      });

      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
        include: favoritePostInclude,
      });

      if (!post) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      return {
        post: toPublicPost(post, request.user.userId),
        favorited: false,
      };
    },
  );

  app.get<{ Querystring: FavoritesQuery }>(
    "/profile/me/favorites/artists",
    {
      preHandler: authenticate,
      schema: favoritesQuerySchema,
    },
    async (request) => {
      const limit = request.query.limit ?? 20;
      const cursor = request.query.cursor;

      const favorites = await prisma.favoriteArtist.findMany({
        where: {
          userId: request.user.userId,
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
          artist: {
            include: profileInclude,
          },
        },
        take: limit + 1,
      });

      const hasNextPage = favorites.length > limit;
      const pageItems = hasNextPage ? favorites.slice(0, limit) : favorites;
      const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : null;

      const followingRelations = await prisma.follow.findMany({
        where: {
          followerId: request.user.userId,
          followingId: {
            in: pageItems.map((item) => item.artist.id),
          },
        },
        select: {
          followingId: true,
        },
      });
      const followingIds = new Set(
        followingRelations.map((relation) => relation.followingId),
      );

      return {
        users: pageItems.map((item) =>
          toProfileResponse(item.artist, {
            followingByMe: followingIds.has(item.artist.id),
            favoritedByMe: true,
          }),
        ),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
    },
  );

  app.get<{ Querystring: FavoritesQuery }>(
    "/profile/me/favorites/posts",
    {
      preHandler: authenticate,
      schema: favoritesQuerySchema,
    },
    async (request) => {
      const limit = request.query.limit ?? 20;
      const cursor = request.query.cursor;

      const favorites = await prisma.favoritePost.findMany({
        where: {
          userId: request.user.userId,
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
          post: {
            include: favoritePostInclude,
          },
        },
        take: limit + 1,
      });

      const hasNextPage = favorites.length > limit;
      const pageItems = hasNextPage ? favorites.slice(0, limit) : favorites;
      const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : null;

      return {
        posts: pageItems.map((item) =>
          toPublicPost(item.post, request.user.userId),
        ),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
    },
  );
}

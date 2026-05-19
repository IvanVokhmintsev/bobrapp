import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import { toPublicPost } from "./post.presenter.js";
import { createPostSchema, likePostSchema } from "./post.schemas.js";
import type { CreatePostBody, PostIdParams } from "./post.types.js";

const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      role: true,
      musicianProfile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
  postLikes: {
    select: {
      userId: true,
    },
  },
} as const;

export async function registerPostRoutes(app: FastifyInstance) {
  app.get("/posts", { preHandler: authenticate }, async (request) => {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: postInclude,
      take: 50,
    });

    return {
      posts: posts.map((post) => toPublicPost(post, request.user.userId)),
    };
  });

  app.post<{ Body: CreatePostBody }>(
    "/posts",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: createPostSchema,
    },
    async (request, reply) => {
      const post = await prisma.post.create({
        data: {
          authorId: request.user.userId,
          text: request.body.text.trim(),
          type: request.body.type,
        },
        include: postInclude,
      });

      return reply.status(201).send({
        post: toPublicPost(post, request.user.userId),
      });
    },
  );

  app.post<{ Params: PostIdParams }>(
    "/posts/:id/like",
    {
      preHandler: authenticate,
      schema: likePostSchema,
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

      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId: request.user.userId,
            postId: request.params.id,
          },
        },
      });

      let post;
      if (existingLike) {
        post = await prisma.post.findUnique({
          where: { id: request.params.id },
          include: postInclude,
        });
      } else {
        await prisma.$transaction(async (transaction) => {
          await transaction.postLike.create({
            data: {
              userId: request.user.userId,
              postId: request.params.id,
            },
          });

          await transaction.post.update({
            where: { id: request.params.id },
            data: {
              likesCount: {
                increment: 1,
              },
            },
          });
        });

        post = await prisma.post.findUnique({
          where: { id: request.params.id },
          include: postInclude,
        });
      }

      if (!post) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      return {
        post: toPublicPost(post, request.user.userId),
      };
    },
  );

  app.delete<{ Params: PostIdParams }>(
    "/posts/:id/like",
    {
      preHandler: authenticate,
      schema: likePostSchema,
    },
    async (request, reply) => {
      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
        include: postInclude,
      });

      if (!post) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId: request.user.userId,
            postId: request.params.id,
          },
        },
      });

      if (existingLike) {
        await prisma.$transaction(async (transaction) => {
          await transaction.postLike.delete({
            where: {
              userId_postId: {
                userId: request.user.userId,
                postId: request.params.id,
              },
            },
          });

          await transaction.post.update({
            where: { id: request.params.id },
            data: {
              likesCount: {
                decrement: 1,
              },
            },
          });
        });
      }

      const updatedPost = await prisma.post.findUnique({
        where: { id: request.params.id },
        include: postInclude,
      });

      if (!updatedPost) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      return {
        post: toPublicPost(updatedPost, request.user.userId),
      };
    },
  );
}

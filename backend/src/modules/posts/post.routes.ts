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
} as const;

export async function registerPostRoutes(app: FastifyInstance) {
  app.get("/posts", { preHandler: authenticate }, async () => {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: postInclude,
      take: 50,
    });

    return {
      posts: posts.map(toPublicPost),
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
        post: toPublicPost(post),
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

      const post = await prisma.post.update({
        where: { id: request.params.id },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        include: postInclude,
      });

      return {
        post: toPublicPost(post),
      };
    },
  );
}

import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";

import { deleteManagedPostMediaSet } from "../../lib/postMedia.js";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import {
  parseCreatePostForm,
  saveCreatePostMedia,
  validateCreatePostForm,
} from "./postMedia.service.js";
import { toPublicPost } from "./post.presenter.js";
import {
  commentParamsSchema,
  commentPostSchema,
  feedQuerySchema,
  likePostSchema,
  postIdParamsSchema,
} from "./post.schemas.js";
import type {
  CommentParams,
  CreateCommentBody,
  FeedQuery,
  PostIdParams,
} from "./post.types.js";

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
  reposts: {
    select: {
      userId: true,
    },
  },
} as const;

export async function registerPostRoutes(app: FastifyInstance) {
  app.get<{ Querystring: FeedQuery }>(
    "/posts",
    { preHandler: authenticate, schema: feedQuerySchema },
    async (request) => {
      const limit = request.query.limit ?? 20;
      const cursor = request.query.cursor;

      const follows = await prisma.follow.findMany({
        where: {
          followerId: request.user.userId,
        },
        select: {
          followingId: true,
        },
      });

      const followingIds = follows.map((follow) => follow.followingId);

      const posts = await prisma.post.findMany({
        where: {
          OR: [
            {
              authorId: request.user.userId,
            },
            ...(followingIds.length > 0
              ? [
                  {
                    authorId: {
                      in: followingIds,
                    },
                  },
                ]
              : []),
          ],
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
        include: postInclude,
        take: limit + 1,
      });

      const hasNextPage = posts.length > limit;
      const pageItems = hasNextPage ? posts.slice(0, limit) : posts;
      const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : null;

      return {
        posts: pageItems.map((post) => toPublicPost(post, request.user.userId)),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
    },
  );

  app.post(
    "/posts",
    {
      preHandler: [authenticate, requireRole("musician")],
    },
    async (request, reply) => {
      const form = await parseCreatePostForm(request.parts());
      const validationError = validateCreatePostForm(form);

      if (validationError) {
        return reply.status(400).send({
          error: validationError,
          statusCode: 400,
        });
      }

      const postId = randomUUID();
      let imageUrl: string | null = null;
      let audioUrl: string | null = null;

      try {
        ({ imageUrl, audioUrl } = await saveCreatePostMedia(postId, form));

        const post = await prisma.post.create({
          data: {
            id: postId,
            authorId: request.user.userId,
            text: form.text.trim(),
            type: form.type,
            imageUrl,
            audioUrl,
          },
          include: postInclude,
        });

        return reply.status(201).send({
          post: toPublicPost(post, request.user.userId),
        });
      } catch (error) {
        await deleteManagedPostMediaSet(imageUrl, audioUrl);
        throw error;
      }
    },
  );

  app.delete<{ Params: PostIdParams }>(
    "/posts/:id",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: postIdParamsSchema,
    },
    async (request, reply) => {
      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
        select: {
          id: true,
          authorId: true,
          imageUrl: true,
          audioUrl: true,
        },
      });

      if (!post) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      if (post.authorId !== request.user.userId) {
        return reply.status(403).send({
          error: "Only the post author can delete this post",
          statusCode: 403,
        });
      }

      await deleteManagedPostMediaSet(post.imageUrl, post.audioUrl);

      await prisma.post.delete({
        where: { id: post.id },
      });

      return reply.status(204).send();
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

      if (!existingLike) {
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
      }

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

  app.post<{ Params: PostIdParams }>(
    "/posts/:id/repost",
    {
      preHandler: [authenticate, requireRole("musician")],
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

      const existingRepost = await prisma.repost.findUnique({
        where: {
          userId_postId: {
            userId: request.user.userId,
            postId: request.params.id,
          },
        },
      });

      if (!existingRepost) {
        await prisma.$transaction(async (transaction) => {
          await transaction.repost.create({
            data: {
              userId: request.user.userId,
              postId: request.params.id,
            },
          });

          await transaction.post.update({
            where: { id: request.params.id },
            data: {
              repostsCount: {
                increment: 1,
              },
            },
          });
        });
      }

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

      return {
        post: toPublicPost(post, request.user.userId),
      };
    },
  );

  app.delete<{ Params: PostIdParams }>(
    "/posts/:id/repost",
    {
      preHandler: [authenticate, requireRole("musician")],
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

      const existingRepost = await prisma.repost.findUnique({
        where: {
          userId_postId: {
            userId: request.user.userId,
            postId: request.params.id,
          },
        },
      });

      if (existingRepost) {
        await prisma.$transaction(async (transaction) => {
          await transaction.repost.delete({
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
              repostsCount: {
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

  app.get<{ Params: PostIdParams }>(
    "/posts/:id/comments",
    {
      preHandler: authenticate,
      schema: postIdParamsSchema,
    },
    async (request, reply) => {
      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!post) {
        return reply.status(404).send({
          error: "Post not found",
          statusCode: 404,
        });
      }

      const comments = await prisma.comment.findMany({
        where: {
          postId: request.params.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
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
        },
      });

      return {
        comments: comments.map((comment) => ({
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          author: {
            id: comment.author.id,
            name: comment.author.name,
            role: comment.author.role,
            avatarUrl: comment.author.musicianProfile?.avatarUrl ?? null,
          },
        })),
      };
    },
  );

  app.post<{ Params: PostIdParams; Body: CreateCommentBody }>(
    "/posts/:id/comments",
    {
      preHandler: authenticate,
      schema: commentPostSchema,
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

      const comment = await prisma.$transaction(async (transaction) => {
        const created = await transaction.comment.create({
          data: {
            postId: request.params.id,
            authorId: request.user.userId,
            text: request.body.text.trim(),
          },
          include: {
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
          },
        });

        await transaction.post.update({
          where: {
            id: request.params.id,
          },
          data: {
            commentsCount: {
              increment: 1,
            },
          },
        });

        return created;
      });

      return reply.status(201).send({
        comment: {
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          author: {
            id: comment.author.id,
            name: comment.author.name,
            role: comment.author.role,
            avatarUrl: comment.author.musicianProfile?.avatarUrl ?? null,
          },
        },
      });
    },
  );

  app.delete<{ Params: CommentParams }>(
    "/posts/:id/comments/:commentId",
    {
      preHandler: authenticate,
      schema: commentParamsSchema,
    },
    async (request, reply) => {
      const comment = await prisma.comment.findUnique({
        where: {
          id: request.params.commentId,
        },
        include: {
          post: {
            select: {
              id: true,
              authorId: true,
            },
          },
        },
      });

      if (!comment || comment.postId !== request.params.id) {
        return reply.status(404).send({
          error: "Comment not found",
          statusCode: 404,
        });
      }

      const canDelete =
        comment.authorId === request.user.userId ||
        comment.post.authorId === request.user.userId;

      if (!canDelete) {
        return reply.status(403).send({
          error: "Only the comment author or post author can delete this comment",
          statusCode: 403,
        });
      }

      await prisma.$transaction(async (transaction) => {
        await transaction.comment.delete({
          where: {
            id: comment.id,
          },
        });

        await transaction.post.update({
          where: {
            id: comment.postId,
          },
          data: {
            commentsCount: {
              decrement: 1,
            },
          },
        });
      });

      return reply.status(204).send();
    },
  );
}

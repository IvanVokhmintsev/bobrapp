import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import {
  buildAvatarFileName,
  buildAvatarPublicPath,
  deleteManagedAvatar,
  isAllowedAvatarMimeType,
  isManagedAvatarUrl,
  maxAvatarBytes,
  saveAvatarFile,
} from "../../lib/avatars.js";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { toPublicPost } from "../posts/post.presenter.js";
import { toPublicUser } from "../users/user.presenter.js";
import {
  achievementParamsSchema,
  createAchievementSchema,
  createProfileAlbumSchema,
  createProfileConcertSchema,
  followsQuerySchema,
  profileAlbumParamsSchema,
  profileConcertParamsSchema,
  profilePostsQuerySchema,
  publicProfileSchema,
  publicProfilesQuerySchema,
  updateAchievementSchema,
  updateProfileAlbumSchema,
  updateProfileConcertSchema,
  updateProfileSchema,
} from "./profile.schemas.js";
import {
  parseOptionalDate,
  parseRequiredDate,
  toPublicProfileAlbum,
  toPublicProfileConcert,
} from "./profile-content.presenter.js";
import type {
  AchievementParams,
  CreateAchievementBody,
  CreateProfileAlbumBody,
  CreateProfileConcertBody,
  FollowsQuery,
  ProfileAlbumParams,
  ProfileConcertParams,
  ProfilePostsQuery,
  PublicProfileParams,
  PublicProfilesQuery,
  UpdateAchievementBody,
  UpdateProfileAlbumBody,
  UpdateProfileConcertBody,
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

type ProfileUser = Prisma.UserGetPayload<{
  include: typeof profileInclude;
}>;

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

function toProfileResponse(user: ProfileUser, followingByMe = false) {
  return {
    ...toPublicUser(user),
    followersCount: user._count.followers,
    followingCount: user._count.following,
    followingByMe,
  };
}

function cleanStringArray(values: string[] | undefined) {
  if (values === undefined) {
    return undefined;
  }

  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

async function getMusicianProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      musicianProfile: {
        select: { id: true },
      },
    },
  });

  if (!user || user.role !== "musician" || !user.musicianProfile) {
    return null;
  }

  return user.musicianProfile;
}

async function getMusicianProfileIdForUser(userId: string) {
  const profile = await getMusicianProfileForUser(userId);
  return profile?.id ?? null;
}

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
        user: toProfileResponse(user),
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
      const {
        name,
        bio,
        avatarUrl,
        location,
        profileType,
        genres,
        instruments,
        daw,
        memberNames,
        socialLinks,
      } = request.body;

      if (
        name === undefined &&
        bio === undefined &&
        avatarUrl === undefined &&
        location === undefined &&
        profileType === undefined &&
        genres === undefined &&
        instruments === undefined &&
        daw === undefined &&
        memberNames === undefined &&
        socialLinks === undefined
      ) {
        return reply.status(400).send({
          error: "No profile fields provided",
          statusCode: 400,
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          musicianProfile: true,
        },
      });

      if (!existingUser) {
        return reply.status(404).send({
          error: "User not found",
          statusCode: 404,
        });
      }

      if (
        avatarUrl !== undefined &&
        avatarUrl.trim() === "" &&
        isManagedAvatarUrl(existingUser.musicianProfile?.avatarUrl)
      ) {
        await deleteManagedAvatar(existingUser.musicianProfile?.avatarUrl);
      }

      const user = await prisma.user.update({
        where: {
          id: request.user.userId,
        },
        data: {
          name: name?.trim(),
          musicianProfile:
            bio !== undefined ||
            avatarUrl !== undefined ||
            location !== undefined ||
            profileType !== undefined ||
            genres !== undefined ||
            instruments !== undefined ||
            daw !== undefined ||
            memberNames !== undefined ||
            socialLinks !== undefined
              ? {
                  upsert: {
                    create: {
                      bio: bio?.trim() ?? null,
                      avatarUrl: avatarUrl?.trim() || null,
                      location: location?.trim() ?? null,
                      profileType: profileType ?? "solo",
                      genres: cleanStringArray(genres) ?? [],
                      instruments: cleanStringArray(instruments) ?? [],
                      daw: cleanStringArray(daw) ?? [],
                      memberNames: cleanStringArray(memberNames) ?? [],
                      socialLinks: (socialLinks ?? {}) as Prisma.InputJsonValue,
                    },
                    update: {
                      bio: bio !== undefined ? bio.trim() : undefined,
                      avatarUrl:
                        avatarUrl !== undefined
                          ? avatarUrl.trim() || null
                          : undefined,
                      location:
                        location !== undefined ? location.trim() : undefined,
                      profileType,
                      genres: cleanStringArray(genres),
                      instruments: cleanStringArray(instruments),
                      daw: cleanStringArray(daw),
                      memberNames: cleanStringArray(memberNames),
                      socialLinks:
                        socialLinks !== undefined
                          ? (socialLinks as Prisma.InputJsonValue)
                          : undefined,
                    },
                  },
                }
              : undefined,
        },
        include: profileInclude,
      });

      return reply.send({
        user: toProfileResponse(user),
      });
    },
  );

  app.post(
    "/profile/me/avatar",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          error: "Avatar file is required",
          statusCode: 400,
        });
      }

      if (!isAllowedAvatarMimeType(file.mimetype)) {
        return reply.status(400).send({
          error: "Avatar must be a JPEG, PNG, WebP, or GIF image",
          statusCode: 400,
        });
      }

      let buffer: Buffer;
      try {
        buffer = await file.toBuffer();
      } catch {
        return reply.status(413).send({
          error: `Avatar must be smaller than ${maxAvatarBytes / (1024 * 1024)}MB`,
          statusCode: 413,
        });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          musicianProfile: true,
        },
      });

      if (!currentUser) {
        return reply.status(404).send({
          error: "User not found",
          statusCode: 404,
        });
      }

      if (currentUser.role !== "musician") {
        return reply.status(403).send({
          error: "Only musician accounts can upload avatars",
          statusCode: 403,
        });
      }

      const fileName = buildAvatarFileName(request.user.userId, file.mimetype);
      await saveAvatarFile(fileName, buffer);
      const nextAvatarUrl = buildAvatarPublicPath(fileName);

      await deleteManagedAvatar(currentUser.musicianProfile?.avatarUrl);

      const user = await prisma.user.update({
        where: { id: request.user.userId },
        data: {
          musicianProfile: {
            upsert: {
              create: {
                avatarUrl: nextAvatarUrl,
              },
              update: {
                avatarUrl: nextAvatarUrl,
              },
            },
          },
        },
        include: profileInclude,
      });

      return reply.send({
        user: toProfileResponse(user),
      });
    },
  );

  app.delete(
    "/profile/me/avatar",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const currentUser = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          musicianProfile: true,
        },
      });

      if (!currentUser) {
        return reply.status(404).send({
          error: "User not found",
          statusCode: 404,
        });
      }

      if (!currentUser.musicianProfile?.avatarUrl) {
        return reply.status(400).send({
          error: "Avatar is not set",
          statusCode: 400,
        });
      }

      await deleteManagedAvatar(currentUser.musicianProfile.avatarUrl);

      const user = await prisma.user.update({
        where: { id: request.user.userId },
        data: {
          musicianProfile: {
            update: {
              avatarUrl: null,
            },
          },
        },
        include: profileInclude,
      });

      return reply.send({
        user: toProfileResponse(user),
      });
    },
  );

  app.get<{ Querystring: PublicProfilesQuery }>(
    "/profiles",
    {
      preHandler: authenticate,
      schema: publicProfilesQuerySchema,
    },
    async (request) => {
      const limit = request.query.limit ?? 20;
      const cursor = request.query.cursor;
      const query = request.query.q?.trim();
      const profileType = request.query.type;
      const where: Prisma.UserWhereInput = {
        role: "musician",
        ...(profileType
          ? {
              musicianProfile: {
                is: {
                  profileType,
                },
              },
            }
          : {}),
        ...(query
          ? {
              name: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      };

      const users = await prisma.user.findMany({
        where,
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "asc",
          },
        ],
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        include: profileInclude,
        take: limit + 1,
      });

      const hasNextPage = users.length > limit;
      const pageItems = hasNextPage ? users.slice(0, limit) : users;
      const nextCursor = hasNextPage
        ? pageItems[pageItems.length - 1]?.id
        : null;
      const followingRelations = await prisma.follow.findMany({
        where: {
          followerId: request.user.userId,
          followingId: {
            in: pageItems.map((user) => user.id),
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
        users: pageItems.map((user) =>
          toProfileResponse(user, followingIds.has(user.id)),
        ),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
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

      const relation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: request.user.userId,
            followingId: request.params.userId,
          },
        },
      });

      return reply.send({
        user: toProfileResponse(user, relation !== null),
      });
    },
  );

  app.get<{ Params: PublicProfileParams; Querystring: ProfilePostsQuery }>(
    "/profiles/:userId/posts",
    {
      preHandler: authenticate,
      schema: {
        ...publicProfileSchema,
        ...profilePostsQuerySchema,
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

      const posts = await prisma.post.findMany({
        where: {
          authorId: request.params.userId,
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
      const nextCursor = hasNextPage
        ? pageItems[pageItems.length - 1]?.id
        : null;

      return {
        posts: pageItems.map((post) => toPublicPost(post, request.user.userId)),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
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
        users: pageItems.map((relation) =>
          toProfileResponse(relation.following, true),
        ),
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
      const followingRelations = await prisma.follow.findMany({
        where: {
          followerId: request.user.userId,
          followingId: {
            in: pageItems.map((relation) => relation.follower.id),
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
        users: pageItems.map((relation) =>
          toProfileResponse(
            relation.follower,
            followingIds.has(relation.follower.id),
          ),
        ),
        pageInfo: {
          hasNextPage,
          nextCursor,
        },
      };
    },
  );

  app.post<{ Body: CreateAchievementBody }>(
    "/profile/me/achievements",
    {
      preHandler: authenticate,
      schema: createAchievementSchema,
    },
    async (request, reply) => {
      const achievement = await prisma.achievement.create({
        data: {
          userId: request.user.userId,
          title: request.body.title.trim(),
          description: request.body.description?.trim() ?? null,
          type: "professional",
        },
      });

      return reply.status(201).send({
        achievement: {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          createdAt: achievement.createdAt.toISOString(),
        },
      });
    },
  );

  app.patch<{ Params: AchievementParams; Body: UpdateAchievementBody }>(
    "/profile/me/achievements/:achievementId",
    {
      preHandler: authenticate,
      schema: updateAchievementSchema,
    },
    async (request, reply) => {
      const { title, description } = request.body;

      if (title === undefined && description === undefined) {
        return reply.status(400).send({
          error: "No achievement fields provided",
          statusCode: 400,
        });
      }

      const existing = await prisma.achievement.findFirst({
        where: {
          id: request.params.achievementId,
          userId: request.user.userId,
          type: "professional",
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Achievement not found",
          statusCode: 404,
        });
      }

      const achievement = await prisma.achievement.update({
        where: {
          id: existing.id,
        },
        data: {
          title: title !== undefined ? title.trim() : undefined,
          description:
            description !== undefined ? description?.trim() ?? null : undefined,
        },
      });

      return {
        achievement: {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          createdAt: achievement.createdAt.toISOString(),
        },
      };
    },
  );

  app.delete<{ Params: AchievementParams }>(
    "/profile/me/achievements/:achievementId",
    {
      preHandler: authenticate,
      schema: achievementParamsSchema,
    },
    async (request, reply) => {
      const existing = await prisma.achievement.findFirst({
        where: {
          id: request.params.achievementId,
          userId: request.user.userId,
          type: "professional",
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Achievement not found",
          statusCode: 404,
        });
      }

      await prisma.achievement.delete({
        where: {
          id: existing.id,
        },
      });

      return reply.status(204).send();
    },
  );

  app.get<{ Params: PublicProfileParams }>(
    "/profiles/:userId/albums",
    {
      preHandler: authenticate,
      schema: publicProfileSchema,
    },
    async (request, reply) => {
      const profileId = await getMusicianProfileIdForUser(request.params.userId);

      if (!profileId) {
        return reply.status(404).send({
          error: "Profile not found",
          statusCode: 404,
        });
      }

      const albums = await prisma.profileAlbum.findMany({
        where: { musicianProfileId: profileId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });

      return {
        albums: albums.map(toPublicProfileAlbum),
      };
    },
  );

  app.get<{ Params: PublicProfileParams }>(
    "/profiles/:userId/concerts",
    {
      preHandler: authenticate,
      schema: publicProfileSchema,
    },
    async (request, reply) => {
      const profileId = await getMusicianProfileIdForUser(request.params.userId);

      if (!profileId) {
        return reply.status(404).send({
          error: "Profile not found",
          statusCode: 404,
        });
      }

      const concerts = await prisma.profileConcert.findMany({
        where: { musicianProfileId: profileId },
        orderBy: [{ sortOrder: "asc" }, { eventDate: "desc" }],
      });

      return {
        concerts: concerts.map(toPublicProfileConcert),
      };
    },
  );

  app.post<{ Body: CreateProfileAlbumBody }>(
    "/profile/me/albums",
    {
      preHandler: authenticate,
      schema: createProfileAlbumSchema,
    },
    async (request, reply) => {
      const profile = await getMusicianProfileForUser(request.user.userId);

      if (!profile) {
        return reply.status(403).send({
          error: "Only musician accounts can manage albums",
          statusCode: 403,
        });
      }

      const album = await prisma.profileAlbum.create({
        data: {
          musicianProfileId: profile.id,
          title: request.body.title.trim(),
          releaseDate: parseOptionalDate(request.body.releaseDate) ?? null,
          coverUrl: request.body.coverUrl?.trim() || null,
          sortOrder: request.body.sortOrder ?? 0,
        },
      });

      return reply.status(201).send({
        album: toPublicProfileAlbum(album),
      });
    },
  );

  app.patch<{ Params: ProfileAlbumParams; Body: UpdateProfileAlbumBody }>(
    "/profile/me/albums/:albumId",
    {
      preHandler: authenticate,
      schema: updateProfileAlbumSchema,
    },
    async (request, reply) => {
      const profileId = await getMusicianProfileIdForUser(request.user.userId);

      if (!profileId) {
        return reply.status(403).send({
          error: "Only musician accounts can manage albums",
          statusCode: 403,
        });
      }

      const { title, releaseDate, coverUrl, sortOrder } = request.body;

      if (
        title === undefined &&
        releaseDate === undefined &&
        coverUrl === undefined &&
        sortOrder === undefined
      ) {
        return reply.status(400).send({
          error: "No album fields provided",
          statusCode: 400,
        });
      }

      const existing = await prisma.profileAlbum.findFirst({
        where: {
          id: request.params.albumId,
          musicianProfileId: profileId,
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Album not found",
          statusCode: 404,
        });
      }

      const album = await prisma.profileAlbum.update({
        where: { id: existing.id },
        data: {
          title: title !== undefined ? title.trim() : undefined,
          releaseDate:
            releaseDate !== undefined
              ? parseOptionalDate(releaseDate)
              : undefined,
          coverUrl:
            coverUrl !== undefined ? coverUrl?.trim() || null : undefined,
          sortOrder,
        },
      });

      return {
        album: toPublicProfileAlbum(album),
      };
    },
  );

  app.delete<{ Params: ProfileAlbumParams }>(
    "/profile/me/albums/:albumId",
    {
      preHandler: authenticate,
      schema: profileAlbumParamsSchema,
    },
    async (request, reply) => {
      const profileId = await getMusicianProfileIdForUser(request.user.userId);

      if (!profileId) {
        return reply.status(403).send({
          error: "Only musician accounts can manage albums",
          statusCode: 403,
        });
      }

      const existing = await prisma.profileAlbum.findFirst({
        where: {
          id: request.params.albumId,
          musicianProfileId: profileId,
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Album not found",
          statusCode: 404,
        });
      }

      await prisma.profileAlbum.delete({
        where: { id: existing.id },
      });

      return reply.status(204).send();
    },
  );

  app.post<{ Body: CreateProfileConcertBody }>(
    "/profile/me/concerts",
    {
      preHandler: authenticate,
      schema: createProfileConcertSchema,
    },
    async (request, reply) => {
      const profile = await getMusicianProfileForUser(request.user.userId);

      if (!profile) {
        return reply.status(403).send({
          error: "Only musician accounts can manage concerts",
          statusCode: 403,
        });
      }

      const concert = await prisma.profileConcert.create({
        data: {
          musicianProfileId: profile.id,
          venue: request.body.venue.trim(),
          eventDate: parseRequiredDate(request.body.eventDate),
          coverUrl: request.body.coverUrl?.trim() || null,
          sortOrder: request.body.sortOrder ?? 0,
        },
      });

      return reply.status(201).send({
        concert: toPublicProfileConcert(concert),
      });
    },
  );

  app.patch<{ Params: ProfileConcertParams; Body: UpdateProfileConcertBody }>(
    "/profile/me/concerts/:concertId",
    {
      preHandler: authenticate,
      schema: updateProfileConcertSchema,
    },
    async (request, reply) => {
      const profileId = await getMusicianProfileIdForUser(request.user.userId);

      if (!profileId) {
        return reply.status(403).send({
          error: "Only musician accounts can manage concerts",
          statusCode: 403,
        });
      }

      const { venue, eventDate, coverUrl, sortOrder } = request.body;

      if (
        venue === undefined &&
        eventDate === undefined &&
        coverUrl === undefined &&
        sortOrder === undefined
      ) {
        return reply.status(400).send({
          error: "No concert fields provided",
          statusCode: 400,
        });
      }

      const existing = await prisma.profileConcert.findFirst({
        where: {
          id: request.params.concertId,
          musicianProfileId: profileId,
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Concert not found",
          statusCode: 404,
        });
      }

      const concert = await prisma.profileConcert.update({
        where: { id: existing.id },
        data: {
          venue: venue !== undefined ? venue.trim() : undefined,
          eventDate:
            eventDate !== undefined ? parseRequiredDate(eventDate) : undefined,
          coverUrl:
            coverUrl !== undefined ? coverUrl?.trim() || null : undefined,
          sortOrder,
        },
      });

      return {
        concert: toPublicProfileConcert(concert),
      };
    },
  );

  app.delete<{ Params: ProfileConcertParams }>(
    "/profile/me/concerts/:concertId",
    {
      preHandler: authenticate,
      schema: profileConcertParamsSchema,
    },
    async (request, reply) => {
      const profileId = await getMusicianProfileIdForUser(request.user.userId);

      if (!profileId) {
        return reply.status(403).send({
          error: "Only musician accounts can manage concerts",
          statusCode: 403,
        });
      }

      const existing = await prisma.profileConcert.findFirst({
        where: {
          id: request.params.concertId,
          musicianProfileId: profileId,
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Concert not found",
          statusCode: 404,
        });
      }

      await prisma.profileConcert.delete({
        where: { id: existing.id },
      });

      return reply.status(204).send();
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

import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import { toPublicUser } from "../users/user.presenter.js";
import { musicianOnboardingSchema, labelOnboardingSchema } from "./onboarding.schemas.js";
import type { LabelOnboardingBody, MusicianOnboardingBody } from "./onboarding.types.js";

export async function registerOnboardingRoutes(app: FastifyInstance) {
  app.post<{ Body: MusicianOnboardingBody }>(
    "/onboarding/musician",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: musicianOnboardingSchema,
    },
    async (request) => {
      const profileType = request.body.profileType ?? "solo";
      const memberNames = [...new Set(
        (request.body.memberNames ?? [])
          .map((value) => value.trim())
          .filter(Boolean),
      )];

      const user = await prisma.user.update({
        where: { id: request.user.userId },
        data: {
          musicianProfile: {
            upsert: {
              create: {
                level: request.body.level,
                profileType,
                memberNames: profileType === "band" ? memberNames : [],
              },
              update: {
                level: request.body.level,
                profileType,
                memberNames: profileType === "band" ? memberNames : [],
              },
            },
          },
        },
        include: {
          musicianProfile: true,
          labelProfile: true,
        },
      });

      return {
        user: toPublicUser(user),
      };
    },
  );

  app.post<{ Body: LabelOnboardingBody }>(
    "/onboarding/label",
    {
      preHandler: [authenticate, requireRole("label")],
      schema: labelOnboardingSchema,
    },
    async (request) => {
      const genres = [
        ...new Set(
          (request.body.genres ?? [])
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      ];

      const user = await prisma.user.update({
        where: { id: request.user.userId },
        data: {
          labelProfile: {
            upsert: {
              create: {
                companyName: request.body.companyName.trim(),
                description: request.body.description?.trim() || null,
                genres,
                onboardedAt: new Date(),
              },
              update: {
                companyName: request.body.companyName.trim(),
                description: request.body.description?.trim() || null,
                genres,
                onboardedAt: new Date(),
              },
            },
          },
        },
        include: {
          musicianProfile: true,
          labelProfile: true,
        },
      });

      return {
        user: toPublicUser(user),
      };
    },
  );
}

import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import { toPublicUser } from "../users/user.presenter.js";
import { musicianOnboardingSchema } from "./onboarding.schemas.js";
import type { MusicianOnboardingBody } from "./onboarding.types.js";

export async function registerOnboardingRoutes(app: FastifyInstance) {
  app.post<{ Body: MusicianOnboardingBody }>(
    "/onboarding/musician",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: musicianOnboardingSchema,
    },
    async (request) => {
      const user = await prisma.user.update({
        where: { id: request.user.userId },
        data: {
          musicianProfile: {
            upsert: {
              create: {
                level: request.body.level,
              },
              update: {
                level: request.body.level,
              },
            },
          },
        },
        include: {
          musicianProfile: true,
        },
      });

      return {
        user: toPublicUser(user),
      };
    },
  );
}

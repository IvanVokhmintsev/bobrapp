import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import {
  toPublicRoadmapLesson,
  toPublicRoadmapStep,
} from "./roadmap.presenter.js";
import { roadmapStepParamsSchema } from "./roadmap.schemas.js";
import { ensureUserRoadmapProgress } from "./roadmap.service.js";
import type { RoadmapStepParams } from "./roadmap.types.js";

function progressInclude(userId: string) {
  return {
    userProgress: {
      where: {
        userId,
      },
      select: {
        status: true,
        completedAt: true,
      },
    },
  } as const;
}

export async function registerRoadmapRoutes(app: FastifyInstance) {
  app.get(
    "/roadmap",
    {
      preHandler: [authenticate, requireRole("musician")],
    },
    async (request) => {
      await ensureUserRoadmapProgress(request.user.userId);

      const steps = await prisma.roadmapStep.findMany({
        orderBy: {
          order: "asc",
        },
        include: progressInclude(request.user.userId),
      });

      return {
        steps: steps.map(toPublicRoadmapStep),
      };
    },
  );

  app.get<{ Params: RoadmapStepParams }>(
    "/roadmap/:stepId",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapStepParamsSchema,
    },
    async (request, reply) => {
      await ensureUserRoadmapProgress(request.user.userId);

      const step = await prisma.roadmapStep.findUnique({
        where: {
          id: request.params.stepId,
        },
        include: progressInclude(request.user.userId),
      });

      if (!step) {
        return reply.status(404).send({
          error: "Roadmap step not found",
          statusCode: 404,
        });
      }

      const status = step.userProgress[0]?.status ?? "locked";

      if (status === "locked") {
        return reply.status(403).send({
          error: "Roadmap step is locked",
          statusCode: 403,
        });
      }

      return {
        step: toPublicRoadmapLesson(step),
      };
    },
  );

  app.post<{ Params: RoadmapStepParams }>(
    "/roadmap/:stepId/complete",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapStepParamsSchema,
    },
    async (request, reply) => {
      await ensureUserRoadmapProgress(request.user.userId);

      const step = await prisma.roadmapStep.findUnique({
        where: {
          id: request.params.stepId,
        },
      });

      if (!step) {
        return reply.status(404).send({
          error: "Roadmap step not found",
          statusCode: 404,
        });
      }

      const currentProgress = await prisma.userRoadmapProgress.findUnique({
        where: {
          userId_stepId: {
            userId: request.user.userId,
            stepId: step.id,
          },
        },
      });

      if (!currentProgress || currentProgress.status === "locked") {
        return reply.status(403).send({
          error: "Roadmap step is locked",
          statusCode: 403,
        });
      }

      await prisma.userRoadmapProgress.update({
        where: {
          userId_stepId: {
            userId: request.user.userId,
            stepId: step.id,
          },
        },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      const nextStep = await prisma.roadmapStep.findFirst({
        where: {
          order: {
            gt: step.order,
          },
        },
        orderBy: {
          order: "asc",
        },
      });

      if (nextStep) {
        await prisma.userRoadmapProgress.update({
          where: {
            userId_stepId: {
              userId: request.user.userId,
              stepId: nextStep.id,
            },
          },
          data: {
            status: "available",
          },
        });
      }

      const steps = await prisma.roadmapStep.findMany({
        orderBy: {
          order: "asc",
        },
        include: progressInclude(request.user.userId),
      });

      return {
        steps: steps.map(toPublicRoadmapStep),
      };
    },
  );
}

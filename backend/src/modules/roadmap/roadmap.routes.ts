import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import {
  toPublicRoadmapLesson,
  toPublicRoadmapResponse,
} from "./roadmap.presenter.js";
import { roadmapChecklistSchema, roadmapQuizSchema, roadmapStepParamsSchema } from "./roadmap.schemas.js";
import {
  completeRoadmapStep,
  ensureUserRoadmapProgress,
  fetchRoadmapForUser,
  readRoadmapQuiz,
  updateChecklistProgress,
} from "./roadmap.service.js";
import type {
  RoadmapChecklistBody,
  RoadmapQuizBody,
  RoadmapStepParams,
} from "./roadmap.types.js";

function progressInclude(userId: string) {
  return {
    level: {
      select: {
        id: true,
        mapNodeId: true,
        title: true,
        order: true,
      },
    },
    userProgress: {
      where: {
        userId,
      },
      select: {
        status: true,
        completedAt: true,
        checklistChecked: true,
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
      const levels = await fetchRoadmapForUser(request.user.userId);

      return toPublicRoadmapResponse(levels);
    },
  );

  async function getRoadmapLesson(
    request: FastifyRequest<{ Params: RoadmapStepParams }>,
    reply: FastifyReply,
  ) {
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
  }

  app.get<{ Params: RoadmapStepParams }>(
    "/roadmap/:stepId",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapStepParamsSchema,
    },
    getRoadmapLesson,
  );

  app.get<{ Params: RoadmapStepParams }>(
    "/roadmap/:stepId/lesson",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapStepParamsSchema,
    },
    getRoadmapLesson,
  );

  app.post<{ Params: RoadmapStepParams }>(
    "/roadmap/:stepId/complete",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapStepParamsSchema,
    },
    async (request, reply) => {
      await ensureUserRoadmapProgress(request.user.userId);

      const result = await completeRoadmapStep(
        request.user.userId,
        request.params.stepId,
      );

      if (result.status === "not_found") {
        return reply.status(404).send({
          error: "Roadmap step not found",
          statusCode: 404,
        });
      }

      if (result.status === "locked") {
        return reply.status(403).send({
          error: "Roadmap step is locked",
          statusCode: 403,
        });
      }

      const levels = await fetchRoadmapForUser(request.user.userId);

      return toPublicRoadmapResponse(levels);
    },
  );

  app.post<{ Params: RoadmapStepParams; Body: RoadmapQuizBody }>(
    "/roadmap/:stepId/quiz",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapQuizSchema,
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

      const quiz = readRoadmapQuiz(step.quiz);
      const answersByQuestionId = new Map(
        request.body.answers.map((answer) => [answer.questionId, answer.optionId]),
      );

      const wrongQuestionIds = quiz
        .filter(
          (question) =>
            answersByQuestionId.get(question.id) !== question.correctOptionId,
        )
        .map((question) => question.id);

      if (wrongQuestionIds.length > 0) {
        return reply.status(422).send({
          passed: false,
          wrongQuestionIds,
        });
      }

      const result = await completeRoadmapStep(
        request.user.userId,
        request.params.stepId,
      );

      const levels = await fetchRoadmapForUser(request.user.userId);
      const roadmap = toPublicRoadmapResponse(levels);

      return {
        passed: true,
        wrongQuestionIds: [],
        ...roadmap,
      };
    },
  );

  app.patch<{ Params: RoadmapStepParams; Body: RoadmapChecklistBody }>(
    "/roadmap/:stepId/checklist",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: roadmapChecklistSchema,
    },
    async (request, reply) => {
      await ensureUserRoadmapProgress(request.user.userId);

      const result = await updateChecklistProgress(
        request.user.userId,
        request.params.stepId,
        request.body.checkedIndices,
      );

      if (result.status === "not_found") {
        return reply.status(404).send({
          error: "Roadmap step not found",
          statusCode: 404,
        });
      }

      if (result.status === "locked") {
        return reply.status(403).send({
          error: "Roadmap step is locked",
          statusCode: 403,
        });
      }

      if (!result.step) {
        return reply.status(404).send({
          error: "Roadmap step not found",
          statusCode: 404,
        });
      }

      const levels = await fetchRoadmapForUser(request.user.userId);

      return {
        ...toPublicRoadmapResponse(levels),
        milestoneCompleted: result.status === "completed",
      };
    },
  );
}

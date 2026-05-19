import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { toPublicUser } from "../users/user.presenter.js";

export async function registerProfileRoutes(app: FastifyInstance) {
  app.get(
    "/profile/me",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          musicianProfile: true,
          achievements: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: "User not found",
          statusCode: 404,
        });
      }

      return reply.send({
        user: toPublicUser(user),
      });
    },
  );
}

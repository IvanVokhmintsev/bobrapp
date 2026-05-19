import type { FastifyReply, FastifyRequest } from "fastify";

type UserRole = "musician" | "label";

export function requireRole(...allowedRoles: UserRole[]) {
  return async function roleGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: "Forbidden",
        statusCode: 403,
      });
    }
  };
}

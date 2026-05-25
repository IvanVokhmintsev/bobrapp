import type { FastifyReply, FastifyRequest } from "fastify";

import { authCookieName } from "./auth.session.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const signedCookie = request.cookies[authCookieName];

    if (!signedCookie) {
      return reply.status(401).send({
        error: "Unauthorized",
        statusCode: 401,
      });
    }

    const cookie = request.unsignCookie(signedCookie);

    if (!cookie.valid || !cookie.value) {
      return reply.status(401).send({
        error: "Unauthorized",
        statusCode: 401,
      });
    }

    request.user = request.server.jwt.verify(cookie.value);
  } catch {
    return reply.status(401).send({
      error: "Unauthorized",
      statusCode: 401,
    });
  }
}

import type { FastifyReply } from "fastify";

import { env } from "../../config/env.js";

export const authCookieName = "bobrapp_session";

const authCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(authCookieName, token, {
    httpOnly: true,
    maxAge: authCookieMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: env.cookieSecure,
    signed: true,
  });
}

export function clearAuthCookie(reply: FastifyReply) {
  reply.clearCookie(authCookieName, {
    path: "/",
    sameSite: "lax",
    secure: env.cookieSecure,
    signed: true,
  });
}

import fs from "node:fs";
import path from "node:path";

import type { FastifyInstance } from "fastify";

import { backendRoot } from "./backendRoot.js";

export function resolveFrontendDist(): string | null {
  const candidates = [
    process.env.FRONTEND_DIST,
    path.join(backendRoot, "../frontend/web/dist"),
    path.join(backendRoot, "public"),
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of candidates) {
    const indexPath = path.join(candidate, "index.html");

    if (fs.existsSync(indexPath)) {
      return candidate;
    }
  }

  return null;
}

export async function registerFrontendStatic(
  app: FastifyInstance,
): Promise<boolean> {
  const frontendDist = resolveFrontendDist();

  if (!frontendDist) {
    return false;
  }

  await app.register(import("@fastify/static"), {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
    decorateReply: true,
  });

  app.setNotFoundHandler(async (request, reply) => {
    const pathname = request.url.split("?")[0] ?? request.url;

    if (request.method !== "GET" && request.method !== "HEAD") {
      return reply.status(404).send({
        error: "Not found",
        statusCode: 404,
      });
    }

    if (pathname.startsWith("/api") || pathname.startsWith("/uploads")) {
      return reply.status(404).send({
        error: "Not found",
        statusCode: 404,
      });
    }

    return reply.sendFile("index.html", frontendDist);
  });

  app.log.info({ frontendDist }, "Serving frontend static files");

  return true;
}

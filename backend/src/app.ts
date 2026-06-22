import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import { avatarsDir, ensureUploadDirs } from "./lib/avatars.js";
import { ensureProfileCoverDirs, profileCoversDir } from "./lib/profileCovers.js";
import { uploadsRoot } from "./lib/backendRoot.js";
import { ensurePostMediaDirs, maxPostMediaBytes } from "./lib/postMedia.js";
import { registerRoutes } from "./routes/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  await ensureUploadDirs();
  await ensureProfileCoverDirs();
  await ensurePostMediaDirs();

  void app.register(import("@fastify/jwt"), {
    secret: env.jwtSecret,
  });

  void app.register(import("@fastify/cookie"), {
    secret: env.cookieSecret,
  });

  void app.register(import("@fastify/cors"), {
    origin: env.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });

  void app.register(import("@fastify/multipart"), {
    limits: {
      fileSize: maxPostMediaBytes,
      files: 2,
    },
  });

  void app.register(import("@fastify/static"), {
    root: uploadsRoot,
    prefix: "/uploads/",
    decorateReply: false,
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const message =
      statusCode >= 500
        ? env.nodeEnv === "development"
          ? error.message
          : "Internal server error"
        : error.message;

    void reply.status(statusCode).send({
      error: message,
      statusCode,
    });
  });

  void registerRoutes(app);

  app.log.info({ avatarsDir, profileCoversDir }, "Upload directories ready");

  return app;
}

import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import {
  avatarsDir,
  ensureUploadDirs,
  maxAvatarBytes,
  uploadsRoot,
} from "./lib/avatars.js";
import { registerRoutes } from "./routes/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  await ensureUploadDirs();

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
      fileSize: maxAvatarBytes,
      files: 1,
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
      statusCode >= 500 ? "Internal server error" : error.message;

    void reply.status(statusCode).send({
      error: message,
      statusCode,
    });
  });

  void registerRoutes(app);

  app.log.info({ avatarsDir }, "Avatar uploads directory ready");

  return app;
}

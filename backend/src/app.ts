import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  void app.register(import("@fastify/jwt"), {
    secret: env.jwtSecret,
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

  return app;
}

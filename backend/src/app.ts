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

  void app.register(import("@fastify/cors"), {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

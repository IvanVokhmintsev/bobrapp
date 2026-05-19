import type { FastifyInstance } from "fastify";

import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerOnboardingRoutes } from "../modules/onboarding/onboarding.routes.js";
import { registerProfileRoutes } from "../modules/profile/profile.routes.js";
import { registerHealthRoutes } from "./health.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerOnboardingRoutes(app);
  await registerProfileRoutes(app);
}

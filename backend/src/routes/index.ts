import type { FastifyInstance } from "fastify";

import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerOnboardingRoutes } from "../modules/onboarding/onboarding.routes.js";
import { registerFavoriteRoutes } from "../modules/favorites/favorites.routes.js";
import { registerPostRoutes } from "../modules/posts/post.routes.js";
import { registerProfileRoutes } from "../modules/profile/profile.routes.js";
import { registerRoadmapRoutes } from "../modules/roadmap/roadmap.routes.js";
import { registerHealthRoutes } from "./health.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerOnboardingRoutes(app);
  await registerPostRoutes(app);
  await registerProfileRoutes(app);
  await registerFavoriteRoutes(app);
  await registerRoadmapRoutes(app);
}

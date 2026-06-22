import type { FastifyInstance } from "fastify";

import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerOnboardingRoutes } from "../modules/onboarding/onboarding.routes.js";
import { registerFavoriteRoutes } from "../modules/favorites/favorites.routes.js";
import { registerPostRoutes } from "../modules/posts/post.routes.js";
import { registerProfileRoutes } from "../modules/profile/profile.routes.js";
import { registerProposalRoutes } from "../modules/proposals/proposals.routes.js";
import { registerRoadmapRoutes } from "../modules/roadmap/roadmap.routes.js";
import { registerHealthRoutes } from "./health.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);

  await app.register(
    async (api) => {
      await registerAuthRoutes(api);
      await registerOnboardingRoutes(api);
      await registerPostRoutes(api);
      await registerProfileRoutes(api);
      await registerFavoriteRoutes(api);
      await registerProposalRoutes(api);
      await registerRoadmapRoutes(api);
    },
    { prefix: "/api" },
  );
}

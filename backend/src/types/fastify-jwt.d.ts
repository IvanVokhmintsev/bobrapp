import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      role: "musician" | "label";
    };
    user: {
      userId: string;
      role: "musician" | "label";
    };
  }
}

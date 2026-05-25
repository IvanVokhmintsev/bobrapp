import "dotenv/config";

type AppEnv = {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  cookieSecret: string;
  cookieSecure: boolean;
  corsOrigins: string[];
};

function readPort(value: string | undefined): number {
  if (!value) {
    return 3000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return port;
}

function readStringList(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return value === "true";
}

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: readPort(process.env.PORT),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/bobrapp?schema=public",
  jwtSecret: process.env.JWT_SECRET ?? "development_jwt_secret",
  cookieSecret: process.env.COOKIE_SECRET ?? "development_cookie_secret",
  cookieSecure: readBoolean(
    process.env.COOKIE_SECURE,
    process.env.NODE_ENV === "production",
  ),
  corsOrigins: readStringList(process.env.CORS_ORIGINS, [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]),
};

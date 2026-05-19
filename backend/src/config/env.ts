import "dotenv/config";

type AppEnv = {
  nodeEnv: string;
  host: string;
  port: number;
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

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: readPort(process.env.PORT),
};

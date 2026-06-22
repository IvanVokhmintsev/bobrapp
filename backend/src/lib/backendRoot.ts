import path from "node:path";

export const backendRoot = path.resolve(process.cwd());
export const uploadsRoot = path.join(backendRoot, "uploads");

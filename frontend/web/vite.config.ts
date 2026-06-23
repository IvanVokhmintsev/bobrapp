import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const allowedHosts = [
  ".bobrapp.ru",
  ".railway.app",
  ...(process.env.VITE_ALLOWED_HOSTS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean) ?? []),
];

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: true,
    allowedHosts,
  },
});

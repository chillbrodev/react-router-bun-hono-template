import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "happy-dom",
    env: loadEnv("test", process.cwd(), ""),
    globals: true,
    include: ["app/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup-test-env.ts"],
  },
});

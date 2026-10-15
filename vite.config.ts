import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { defineConfig } from "vite";

// `bun` (default) runs a Bun server; `cloudflare` builds a Worker.
const target =
  process.env.DEPLOY_TARGET === "cloudflare" ? "cloudflare" : "bun";

export default defineConfig({
  // Separate dependency caches so `dev` and `dev:cf` can run side by side
  cacheDir: `node_modules/.vite-${target}`,
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    // Order matters: cloudflare() → reactRouterHonoServer() → reactRouter()
    target === "cloudflare" && cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouterHonoServer({
      runtime: target,
      serverEntryPoint: `./app/server/${target}.ts`,
    }),
    reactRouter(),
  ],
});

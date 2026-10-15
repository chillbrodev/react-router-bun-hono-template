import type { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type RequestIdVariables, requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { type TimingVariables, timing } from "hono/timing";
import { RouterContextProvider } from "react-router";
import * as pokedex from "~/lib/pokedex.server";
import { api } from "./api";
import { pokedexContext, requestIdContext } from "./context";

/** Hono environment shared by every middleware and route. */
export type AppEnv = {
  Variables: RequestIdVariables & TimingVariables;
};

/**
 * Hono setup shared by every runtime (see `./bun.ts` and `./cloudflare.ts`).
 *
 * `react-router-hono-server` builds the Hono app, then calls `configure` before
 * mounting React Router, so anything registered here runs first.
 */
export function configure(app: Hono<AppEnv>) {
  app.use(requestId());
  app.use(async (c, next) => {
    await next();
    // React Router returns its own Response for pages, so headers set earlier
    // via `c.header()` don't carry over. Re-apply the request id here.
    c.res.headers.set("X-Request-Id", c.get("requestId"));
  });
  app.use(timing());
  app.use(
    secureHeaders({
      // Sprites and artwork are loaded from PokeAPI's GitHub repository
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: "same-site",
    }),
  );

  app.route("/api", api);

  app.get("/healthz", (c) => c.json({ ok: true }));

  app.onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse();
    console.error(`[${c.get("requestId")}]`, error);
    return c.json({ error: "Internal Server Error" }, 500);
  });
}

/** Hands server-side values to React Router loaders and actions. */
export function getLoadContext(c: Context<AppEnv>) {
  const context = new RouterContextProvider();
  context.set(pokedexContext, pokedex);
  context.set(requestIdContext, c.get("requestId"));
  return context;
}

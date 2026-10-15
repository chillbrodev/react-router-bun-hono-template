import { zValidator as zv } from "@hono/zod-validator";
import { Hono } from "hono";
import { endTime, startTime, type TimingVariables } from "hono/timing";
import { type ZodType, z } from "zod";
import * as pokedex from "~/lib/pokedex.server";
import { POKEMON_TYPES } from "~/lib/pokemon";

/** Validates input and returns a readable 400 instead of raw Zod output. */
const validate = <T extends ZodType, Target extends "query" | "param">(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid request",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        400,
      );
    }
  });

const searchQuery = z.object({
  q: z.string().trim().max(50).default(""),
  type: z.enum(POKEMON_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const nameParam = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9-]+$/i, "Use a Pokémon name or National Dex number"),
});

/**
 * JSON API served by Hono alongside the React Router app.
 *
 * Routes are chained so `typeof api` carries every path, input and output
 * type: the client in `~/lib/api-client` uses it for end-to-end type safety.
 */
export const api = new Hono<{ Variables: TimingVariables }>()
  .use(async (c, next) => {
    await next();
    // PokeAPI data rarely changes; let browsers and CDNs cache responses
    if (c.res.ok && !c.res.headers.has("Cache-Control")) {
      c.header("Cache-Control", "public, max-age=300, s-maxage=3600");
    }
  })
  .get("/pokemon", validate("query", searchQuery), async (c) => {
    const { q, type, page } = c.req.valid("query");
    startTime(c, "pokeapi");
    const result = await pokedex.searchPokemon({
      query: q,
      type: type ?? null,
      page,
    });
    endTime(c, "pokeapi");
    return c.json(result);
  })
  .get("/pokemon/random", async (c) => {
    const pokemon = await pokedex.getRandomPokemon();
    c.header("Cache-Control", "no-store");
    return c.json(pokemon);
  })
  .get("/pokemon/:name", validate("param", nameParam), async (c) => {
    startTime(c, "pokeapi");
    const pokemon = await pokedex.getPokemon(c.req.valid("param").name);
    endTime(c, "pokeapi");
    if (!pokemon) return c.json({ error: "Pokémon not found" }, 404);
    return c.json(pokemon);
  });

export type Api = typeof api;

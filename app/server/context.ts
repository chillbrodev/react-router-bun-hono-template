import { createContext } from "react-router";
import type * as pokedex from "~/lib/pokedex.server";

/**
 * Values Hono hands to React Router for every request (see `getLoadContext`
 * in `./app.ts`). Loaders read them with `context.get(...)`, so routes depend
 * on what the server provides instead of importing server modules directly.
 */
export const pokedexContext = createContext<typeof pokedex>();
export const requestIdContext = createContext<string>();

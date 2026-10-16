import {
  createContext,
  createCookie,
  data,
  type MiddlewareFunction,
  type RouterContextProvider,
} from "react-router";
import { MAX_TEAM_SIZE } from "~/lib/pokemon";
import { pokedexContext } from "~/server/context";

// The team lives in a cookie, so pages can be personalized during SSR without
// a database. It only holds Dex numbers, which are validated on every read.
const teamCookie = createCookie("team", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 365,
});

export class Team {
  #ids: number[];
  changed = false;

  constructor(ids: number[]) {
    this.#ids = ids;
  }

  get ids(): readonly number[] {
    return this.#ids;
  }

  get isFull() {
    return this.#ids.length >= MAX_TEAM_SIZE;
  }

  has(id: number) {
    return this.#ids.includes(id);
  }

  add(id: number) {
    if (this.has(id) || this.isFull) return false;
    this.#ids = [...this.#ids, id];
    this.changed = true;
    return true;
  }

  remove(id: number) {
    if (!this.has(id)) return false;
    this.#ids = this.#ids.filter((other) => other !== id);
    this.changed = true;
    return true;
  }
}

export const teamContext = createContext<Team>();

function parseIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter(
    (id): id is number => Number.isInteger(id) && id > 0 && id < 10_000,
  );
  return [...new Set(ids)].slice(0, MAX_TEAM_SIZE);
}

/**
 * React Router middleware (runs on the server for every document and data
 * request). It reads the cookie once *before* loaders and actions run, then
 * writes it back *after* they finish, only if something changed.
 */
export const teamMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const stored = await teamCookie.parse(request.headers.get("Cookie"));
  const team = new Team(parseIds(stored));
  context.set(teamContext, team);

  const response = await next();

  if (team.changed) {
    response.headers.append("Set-Cookie", await teamCookie.serialize(team.ids));
  }
  return response;
};

/**
 * Shared action for adding/removing team members. Works as a plain HTML form
 * POST (no JavaScript) and with `useFetcher` (no page reload).
 */
export async function handleTeamAction(
  request: Request,
  context: Readonly<RouterContextProvider>,
) {
  const form = await request.formData();
  const intent = form.get("intent");
  const id = Number(form.get("id"));
  const team = context.get(teamContext);

  if (!(await context.get(pokedexContext).isValidSpeciesId(id))) {
    return data({ ok: false, error: "Unknown Pokémon." }, { status: 400 });
  }

  if (intent === "remove") {
    team.remove(id);
    return { ok: true, error: null };
  }

  if (intent === "add") {
    if (!team.has(id) && team.isFull) {
      return data(
        {
          ok: false,
          error: `Your team is full (${MAX_TEAM_SIZE} max). Remove one first.`,
        },
        { status: 409 },
      );
    }
    team.add(id);
    return { ok: true, error: null };
  }

  return data({ ok: false, error: "Unknown action." }, { status: 400 });
}

import { testClient } from "hono/testing";
import * as pokedex from "~/lib/pokedex.server";
import { api } from "./api";

vi.mock("~/lib/pokedex.server");

// Same `hc` types the browser client uses, but requests go straight to the
// Hono app in memory: no server or network needed.
const client = testClient(api);

describe("GET /pokemon", () => {
  test("passes validated, normalized query params to the service", async () => {
    vi.mocked(pokedex.searchPokemon).mockResolvedValue({
      results: [{ id: 4, name: "charmander", types: ["fire"] }],
      total: 1,
      page: 2,
      pageCount: 3,
    });

    const res = await client.pokemon.$get({
      query: { q: "  char ", type: "fire", page: "2" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("max-age=300");
    expect(await res.json()).toMatchObject({ total: 1, page: 2 });
    expect(pokedex.searchPokemon).toHaveBeenCalledWith({
      query: "char",
      type: "fire",
      page: 2,
    });
  });

  test("rejects an unknown type with a readable 400", async () => {
    const res = await api.request("/pokemon?type=bogus");

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "Invalid request",
      issues: [{ path: "type" }],
    });
    expect(pokedex.searchPokemon).not.toHaveBeenCalled();
  });

  test("rejects page numbers below 1", async () => {
    const res = await client.pokemon.$get({ query: { page: "0" } });
    expect(res.status).toBe(400);
  });
});

describe("GET /pokemon/:name", () => {
  test("returns 404 when the Pokémon doesn't exist", async () => {
    vi.mocked(pokedex.getPokemon).mockResolvedValue(null);

    const res = await client.pokemon[":name"].$get({
      param: { name: "missingno" },
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Pokémon not found" });
  });

  test("rejects names with invalid characters", async () => {
    const res = await api.request("/pokemon/%3Cscript%3E");

    expect(res.status).toBe(400);
    expect(pokedex.getPokemon).not.toHaveBeenCalled();
  });
});

test("GET /pokemon/random is never cached", async () => {
  vi.mocked(pokedex.getRandomPokemon).mockResolvedValue({
    id: 25,
    name: "pikachu",
    types: ["electric"],
  });

  const res = await client.pokemon.random.$get();

  expect(res.headers.get("Cache-Control")).toBe("no-store");
  expect(await res.json()).toEqual({
    id: 25,
    name: "pikachu",
    types: ["electric"],
  });
});

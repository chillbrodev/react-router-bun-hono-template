import {
  type EvolutionStage,
  formatName,
  idFromUrl,
  isPokemonType,
  type PokemonDetail,
  type PokemonSummary,
  type PokemonType,
} from "./pokemon";

const API_BASE = "https://pokeapi.co/api/v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // PokeAPI data is effectively static
const REQUEST_TIMEOUT_MS = 8_000;

export const PAGE_SIZE = 24;

export class NotFoundError extends Error {}

// PokeAPI's fair-use policy asks clients to cache responses. Promises are
// cached (not results) so concurrent requests for the same resource share
// one network call. Failed requests are evicted so they can be retried.
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

function get<T>(pathOrUrl: string): Promise<T> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : API_BASE + pathOrUrl;
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;

  const value = fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).then(async (res) => {
    if (res.status === 404) throw new NotFoundError(`Not found: ${url}`);
    if (!res.ok) throw new Error(`PokeAPI ${res.status} for ${url}`);
    return (await res.json()) as T;
  });
  value.catch(() => cache.delete(url));

  cache.set(url, { expires: Date.now() + CACHE_TTL_MS, value });
  return value;
}

// Minimal shapes of the PokeAPI responses we use
// https://pokeapi.co/docs/v2
interface NamedResource {
  name: string;
  url: string;
}
interface Localized {
  language: NamedResource;
}
interface ApiList {
  results: NamedResource[];
}
interface ApiType {
  pokemon: { pokemon: NamedResource }[];
}
interface ApiPokemon {
  id: number;
  height: number;
  weight: number;
  species: NamedResource;
  types: { type: NamedResource }[];
  abilities: { ability: NamedResource; is_hidden: boolean }[];
  stats: { base_stat: number; stat: NamedResource }[];
}
interface ApiSpecies {
  id: number;
  name: string;
  is_legendary: boolean;
  is_mythical: boolean;
  generation: NamedResource;
  evolution_chain: { url: string };
  names: (Localized & { name: string })[];
  genera: (Localized & { genus: string })[];
  flavor_text_entries: (Localized & { flavor_text: string })[];
}
interface ApiChainLink {
  species: NamedResource;
  evolves_to: ApiChainLink[];
}

interface SpeciesRef {
  id: number;
  name: string;
}

async function getAllSpecies(): Promise<SpeciesRef[]> {
  const list = await get<ApiList>("/pokemon-species?limit=2000");
  return list.results.map((s) => ({ id: idFromUrl(s.url), name: s.name }));
}

async function getSpeciesIdsForType(type: PokemonType): Promise<Set<number>> {
  const result = await get<ApiType>(`/type/${type}`);
  return new Set(result.pokemon.map((p) => idFromUrl(p.pokemon.url)));
}

function toTypes(types: ApiPokemon["types"]): PokemonType[] {
  return types.map((t) => t.type.name).filter(isPokemonType);
}

export async function searchPokemon({
  query,
  type,
  page,
}: {
  query: string;
  type: PokemonType | null;
  page: number;
}) {
  let species = await getAllSpecies();

  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (q) {
    species = /^\d+$/.test(q)
      ? species.filter((s) => String(s.id).startsWith(String(Number(q))))
      : species.filter((s) => s.name.includes(q.replaceAll(" ", "-")));
  }

  if (type) {
    const ids = await getSpeciesIdsForType(type);
    species = species.filter((s) => ids.has(s.id));
  }

  const total = species.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const slice = species.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const details = await Promise.all(
    slice.map((s) => get<ApiPokemon>(`/pokemon/${s.id}`)),
  );
  const results: PokemonSummary[] = details.map((p) => ({
    id: p.id,
    name: p.species.name,
    types: toTypes(p.types),
  }));

  return { results, total, page: currentPage, pageCount };
}

function flattenEvolution(chain: ApiChainLink): EvolutionStage[][] {
  const stages: EvolutionStage[][] = [];
  let current = [chain];
  while (current.length > 0) {
    stages.push(
      current.map((link) => ({
        id: idFromUrl(link.species.url),
        name: link.species.name,
      })),
    );
    current = current.flatMap((link) => link.evolves_to);
  }
  return stages;
}

/** Returns `null` when the Pokémon does not exist. */
export async function getPokemon(
  nameOrId: string,
): Promise<PokemonDetail | null> {
  const species = await get<ApiSpecies>(
    `/pokemon-species/${encodeURIComponent(nameOrId.toLowerCase())}`,
  ).catch((error: unknown) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });
  if (!species) return null;

  const [pokemon, evolution] = await Promise.all([
    get<ApiPokemon>(`/pokemon/${species.id}`),
    get<{ chain: ApiChainLink }>(species.evolution_chain.url),
  ]);

  const english = <T extends Localized>(entries: T[]) =>
    entries.findLast((e) => e.language.name === "en");

  return {
    id: species.id,
    name: species.name,
    displayName: english(species.names)?.name ?? formatName(species.name),
    genus: english(species.genera)?.genus ?? "",
    flavorText: (english(species.flavor_text_entries)?.flavor_text ?? "")
      // Entries contain hard line/page breaks from the games' text boxes.
      .replace(/[\n\f\r­]+/g, " ")
      .trim(),
    types: toTypes(pokemon.types),
    heightM: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    abilities: pokemon.abilities.map((a) => ({
      name: a.ability.name,
      hidden: a.is_hidden,
    })),
    stats: pokemon.stats.map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    evolution: flattenEvolution(evolution.chain),
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    generation: species.generation.name
      .replace("generation-", "")
      .toUpperCase(),
  };
}

/** A random Pokémon from the National Dex. */
export async function getRandomPokemon(): Promise<PokemonSummary> {
  const species = await getAllSpecies();
  const pick = species[Math.floor(Math.random() * species.length)];
  if (!pick) throw new Error("Species list is empty");
  const pokemon = await get<ApiPokemon>(`/pokemon/${pick.id}`);
  return { id: pick.id, name: pick.name, types: toTypes(pokemon.types) };
}

/** The species immediately before and after `id` in National Dex order. */
export async function getAdjacentSpecies(id: number) {
  const species = await getAllSpecies();
  const index = species.findIndex((s) => s.id === id);
  return {
    prev: (index > 0 && species[index - 1]) || null,
    next: (index !== -1 && species[index + 1]) || null,
  };
}

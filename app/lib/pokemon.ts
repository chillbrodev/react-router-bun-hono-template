// Shared (client + server safe) Pokémon types and helpers.

export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export function isPokemonType(value: unknown): value is PokemonType {
  return POKEMON_TYPES.includes(value as PokemonType);
}

// Literal class strings so Tailwind can detect them. Text colors are chosen
// per type so every badge meets WCAG AA (4.5:1) contrast.
export const TYPE_STYLES: Record<PokemonType, string> = {
  normal: "bg-[#A8A77A] text-gray-900",
  fire: "bg-[#EE8130] text-gray-900",
  water: "bg-[#6390F0] text-gray-900",
  electric: "bg-[#F7D02C] text-gray-900",
  grass: "bg-[#7AC74C] text-gray-900",
  ice: "bg-[#96D9D6] text-gray-900",
  fighting: "bg-[#C22E28] text-white",
  poison: "bg-[#A33EA1] text-white",
  ground: "bg-[#E2BF65] text-gray-900",
  flying: "bg-[#A98FF3] text-gray-900",
  psychic: "bg-[#F95587] text-gray-900",
  bug: "bg-[#A6B91A] text-gray-900",
  rock: "bg-[#B6A136] text-gray-900",
  ghost: "bg-[#735797] text-white",
  dragon: "bg-[#6F35FC] text-white",
  dark: "bg-[#705746] text-white",
  steel: "bg-[#B7B7CE] text-gray-900",
  fairy: "bg-[#D685AD] text-gray-900",
};

export interface PokemonSummary {
  id: number;
  name: string;
  types: PokemonType[];
}

export interface EvolutionStage {
  id: number;
  name: string;
}

export interface PokemonDetail extends PokemonSummary {
  displayName: string;
  genus: string;
  flavorText: string;
  heightM: number;
  weightKg: number;
  abilities: { name: string; hidden: boolean }[];
  stats: { name: string; value: number }[];
  /** Each entry is a stage; a stage may branch (e.g. Eevee). */
  evolution: EvolutionStage[][];
  isLegendary: boolean;
  isMythical: boolean;
  generation: string;
}

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export const spriteUrl = (id: number) => `${SPRITE_BASE}/${id}.png`;
export const artworkUrl = (id: number) =>
  `${SPRITE_BASE}/other/official-artwork/${id}.png`;

export const formatDexNumber = (id: number) =>
  `#${String(id).padStart(4, "0")}`;

export const formatName = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

export const formatStatName = (name: string) =>
  STAT_LABELS[name] ?? formatName(name);

/** Extracts the trailing numeric id from a PokeAPI resource URL. */
export function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match?.[1]) throw new Error(`No id found in URL: ${url}`);
  return Number(match[1]);
}

import { Link } from "react-router";
import {
  formatDexNumber,
  formatName,
  type PokemonSummary,
  spriteUrl,
} from "~/lib/pokemon";
import { TypeBadge } from "./type-badge";

export function PokemonCard({ pokemon }: { pokemon: PokemonSummary }) {
  const name = formatName(pokemon.name);

  return (
    <li className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-red-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-gray-800 dark:bg-gray-900">
      <span className="self-start font-mono text-xs text-gray-500 dark:text-gray-400">
        {formatDexNumber(pokemon.id)}
      </span>
      <img
        src={spriteUrl(pokemon.id)}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className="size-24 [image-rendering:pixelated] transition group-hover:scale-110 motion-reduce:transition-none"
      />
      <h2 className="mt-1 text-base font-semibold">
        {/* Stretched link: the whole card is clickable, but only one tab stop */}
        <Link
          to={`/pokemon/${pokemon.name}`}
          prefetch="intent"
          viewTransition
          className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
        >
          {name}
        </Link>
      </h2>
      <div className="mt-2 flex gap-1.5">
        {pokemon.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </li>
  );
}

import { data, isRouteErrorResponse, Link } from "react-router";
import { StatBar } from "~/components/stat-bar";
import { TypeBadge } from "~/components/type-badge";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  spriteUrl,
} from "~/lib/pokemon";
import { pokedexContext } from "~/server/context";
import type { Route } from "./+types/pokemon";

export async function loader({ params, context }: Route.LoaderArgs) {
  const pokedex = context.get(pokedexContext);
  const pokemon = await pokedex.getPokemon(params.name);
  if (!pokemon) {
    throw data(`No Pokémon named “${params.name}”`, { status: 404 });
  }
  const { prev, next } = await pokedex.getAdjacentSpecies(pokemon.id);
  return { pokemon, prev, next };
}

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
});

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "Pokémon not found · Pokédex" }];
  const { pokemon } = loaderData;
  return [
    {
      title: `${pokemon.displayName} ${formatDexNumber(pokemon.id)} · Pokédex`,
    },
    { name: "description", content: pokemon.flavorText },
    { property: "og:image", content: artworkUrl(pokemon.id) },
  ];
};

export default function PokemonPage({ loaderData }: Route.ComponentProps) {
  const { pokemon, prev, next } = loaderData;
  const totalStats = pokemon.stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <article aria-labelledby="pokemon-name" className="space-y-8">
      <nav
        aria-label="Pokémon navigation"
        className="flex justify-between gap-4 text-sm"
      >
        <Link
          to="/"
          className="font-medium text-red-700 hover:underline dark:text-red-400"
        >
          ← Back to Pokédex
        </Link>
        <div className="flex gap-4">
          {prev && (
            <Link
              to={`/pokemon/${prev.name}`}
              prefetch="intent"
              className="font-medium hover:underline"
              aria-label={`Previous Pokémon: ${formatName(prev.name)}`}
            >
              ← {formatName(prev.name)}
            </Link>
          )}
          {next && (
            <Link
              to={`/pokemon/${next.name}`}
              prefetch="intent"
              className="font-medium hover:underline"
              aria-label={`Next Pokémon: ${formatName(next.name)}`}
            >
              {formatName(next.name)} →
            </Link>
          )}
        </div>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 to-amber-50 p-8 dark:from-gray-900 dark:to-gray-800">
          <img
            src={artworkUrl(pokemon.id)}
            alt={`Official artwork of ${pokemon.displayName}`}
            width={475}
            height={475}
            fetchPriority="high"
            className="relative aspect-square w-full max-w-sm drop-shadow-xl [view-transition-name:pokemon-art]"
          />
        </div>

        <div className="space-y-6">
          <header className="space-y-2">
            <p className="font-mono text-gray-600 dark:text-gray-400">
              {formatDexNumber(pokemon.id)} · Generation {pokemon.generation}
            </p>
            <h1
              id="pokemon-name"
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              {pokemon.displayName}
            </h1>
            {pokemon.genus && (
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {pokemon.genus}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {pokemon.types.map((type) => (
                <TypeBadge key={type} type={type} linked />
              ))}
              {pokemon.isLegendary && <Tag>Legendary</Tag>}
              {pokemon.isMythical && <Tag>Mythical</Tag>}
            </div>
          </header>

          {pokemon.flavorText && (
            <blockquote className="border-l-4 border-red-600 pl-4 text-gray-700 italic dark:text-gray-300">
              {pokemon.flavorText}
            </blockquote>
          )}

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Fact label="Height" value={`${pokemon.heightM} m`} />
            <Fact label="Weight" value={`${pokemon.weightKg} kg`} />
            <Fact
              label="Abilities"
              value={pokemon.abilities
                .map((a) => formatName(a.name) + (a.hidden ? " (hidden)" : ""))
                .join(", ")}
            />
          </dl>

          <section aria-labelledby="stats-heading" className="space-y-3">
            <h2 id="stats-heading" className="text-xl font-semibold">
              Base stats
            </h2>
            <dl className="space-y-2">
              {pokemon.stats.map((stat) => (
                <StatBar key={stat.name} name={stat.name} value={stat.value} />
              ))}
            </dl>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold">{totalStats}</span>
            </p>
          </section>
        </div>
      </div>

      {pokemon.evolution.length > 1 && (
        <section aria-labelledby="evolution-heading" className="space-y-4">
          <h2 id="evolution-heading" className="text-xl font-semibold">
            Evolution
          </h2>
          <ol className="flex flex-wrap items-center gap-4">
            {pokemon.evolution.map((stage, index) => (
              <li key={index} className="flex items-center gap-4">
                {index > 0 && (
                  <span aria-hidden="true" className="text-2xl text-gray-400">
                    →
                  </span>
                )}
                <ul className="flex flex-wrap gap-2">
                  {stage.map((evo) => {
                    const current = evo.id === pokemon.id;
                    return (
                      <li key={evo.id}>
                        <Link
                          to={`/pokemon/${evo.name}`}
                          prefetch="intent"
                          aria-current={current ? "page" : undefined}
                          className={`flex flex-col items-center rounded-2xl border p-3 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:hover:bg-gray-900 ${current ? "border-red-600 bg-red-50 dark:bg-red-950/40" : "border-gray-200 dark:border-gray-800"}`}
                        >
                          <img
                            src={spriteUrl(evo.id)}
                            alt=""
                            width={72}
                            height={72}
                            loading="lazy"
                            className="size-18 [image-rendering:pixelated]"
                          />
                          <span className="text-sm font-medium">
                            {formatName(evo.name)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
      <dt className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-900 uppercase dark:bg-amber-900/40 dark:text-amber-200">
      {children}
    </span>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">
        {notFound ? "Who's that Pokémon?" : "Something went wrong"}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        {notFound
          ? String(error.data)
          : "We couldn't reach the Pokédex right now. Please try again."}
      </p>
      <Link
        to="/"
        className="inline-block rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
      >
        Back to Pokédex
      </Link>
    </div>
  );
}

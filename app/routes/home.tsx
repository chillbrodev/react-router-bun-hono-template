import { useEffect, useRef } from "react";
import { Form, Link, useNavigation, useSubmit } from "react-router";
import { PokemonCard } from "~/components/pokemon-card";
import { RandomPokemonButton } from "~/components/random-pokemon-button";
import { formatName, isPokemonType, POKEMON_TYPES } from "~/lib/pokemon";
import { pokedexContext } from "~/server/context";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "Pokédex" },
  {
    name: "description",
    content: "Search and browse every Pokémon by name, number, or type.",
  },
];

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
});

export async function loader({ url, context }: Route.LoaderArgs) {
  const query = url.searchParams.get("q") ?? "";
  const typeParam = url.searchParams.get("type");
  const type = isPokemonType(typeParam) ? typeParam : null;
  const page = Number(url.searchParams.get("page")) || 1;

  const result = await context
    .get(pokedexContext)
    .searchPokemon({ query, type, page });
  return { ...result, query, type };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { results, total, page, pageCount, query, type } = loaderData;
  const navigation = useNavigation();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isSearching =
    navigation.state === "loading" && navigation.location.pathname === "/";

  // Keep inputs in sync on back/forward navigation
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const q = form.elements.namedItem("q");
    const t = form.elements.namedItem("type");
    if (q instanceof HTMLInputElement) q.value = query;
    if (t instanceof HTMLSelectElement) t.value = type ?? "";
  }, [query, type]);

  useEffect(() => () => clearTimeout(debounce.current), []);

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (target > 1) params.set("page", String(target));
    const search = params.toString();
    return search ? `/?${search}` : "/";
  };

  const filterLabel = [query && `“${query}”`, type && formatName(type)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8">
      <section aria-labelledby="search-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1
            id="search-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Find your Pokémon
          </h1>
          <RandomPokemonButton />
        </div>

        <Form
          ref={formRef}
          role="search"
          className="flex flex-col gap-3 sm:flex-row"
          onChange={(event) => {
            const form = event.currentTarget;
            const isTyping = event.target instanceof HTMLInputElement;
            clearTimeout(debounce.current);
            debounce.current = setTimeout(
              () => submit(form, { replace: query !== "" || type !== null }),
              isTyping ? 300 : 0,
            );
          }}
        >
          <div className="relative flex-1">
            <label htmlFor="q" className="sr-only">
              Search by name or number
            </label>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by name or number (e.g. pikachu, 25)"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-4 pl-10 shadow-sm placeholder:text-gray-500 focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="type" className="sr-only">
              Filter by type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={type ?? ""}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:outline-none sm:w-44 dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">All types</option>
              {POKEMON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatName(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Works without JavaScript; with JS, results update as you type */}
          <button
            type="submit"
            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Search
          </button>
        </Form>
      </section>

      <section aria-labelledby="results-heading" aria-busy={isSearching}>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="results-heading" className="text-lg font-semibold">
            {filterLabel ? `Results for ${filterLabel}` : "All Pokémon"}
          </h2>
          <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
            {isSearching
              ? "Searching…"
              : `${total.toLocaleString()} ${total === 1 ? "Pokémon" : "Pokémon"} found`}
          </p>
        </div>

        {results.length > 0 ? (
          <ul
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${isSearching ? "opacity-60 transition-opacity" : ""}`}
          >
            {results.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <p className="text-lg font-medium">No Pokémon found.</p>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Try a different name, number, or type.{" "}
              <Link
                to="/"
                className="font-medium text-red-700 underline dark:text-red-400"
              >
                Clear filters
              </Link>
            </p>
          </div>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-8 flex items-center justify-center gap-2"
          >
            <PageLink to={pageHref(page - 1)} disabled={page <= 1}>
              ← Previous
            </PageLink>
            <p className="px-4 text-sm text-gray-600 dark:text-gray-400">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{pageCount}</span>
            </p>
            <PageLink to={pageHref(page + 1)} disabled={page >= pageCount}>
              Next →
            </PageLink>
          </nav>
        )}
      </section>
    </div>
  );
}

function PageLink({
  to,
  disabled,
  children,
}: {
  to: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className =
    "rounded-lg border px-4 py-2 text-sm font-medium border-gray-300 dark:border-gray-700";

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} opacity-40`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      to={to}
      prefetch="intent"
      className={`${className} hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:hover:bg-gray-800`}
    >
      {children}
    </Link>
  );
}

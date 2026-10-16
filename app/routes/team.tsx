import { Form, Link, useNavigation } from "react-router";
import { TypeBadge } from "~/components/type-badge";
import {
  formatDexNumber,
  formatName,
  MAX_TEAM_SIZE,
  POKEMON_TYPES,
  spriteUrl,
} from "~/lib/pokemon";
import { handleTeamAction, teamContext } from "~/lib/team.server";
import { pokedexContext } from "~/server/context";
import type { Route } from "./+types/team";

export const meta: Route.MetaFunction = () => [
  { title: "My team · Pokédex" },
  { name: "robots", content: "noindex" },
];

// Personalized from a cookie: never share this page via a CDN cache
export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": "private, no-store",
});

export async function loader({ context }: Route.LoaderArgs) {
  const { ids } = context.get(teamContext);
  const members = await context.get(pokedexContext).getSummaries([...ids]);

  // Computed on the server: the browser only receives the result
  const coverage = new Set(members.flatMap((m) => m.types));
  const missing = POKEMON_TYPES.filter((t) => !coverage.has(t));

  return { members, missing };
}

export async function action({ request, context }: Route.ActionArgs) {
  return handleTeamAction(request, context);
}

export default function TeamPage({ loaderData }: Route.ComponentProps) {
  const { members, missing } = loaderData;
  const navigation = useNavigation();
  const removingId =
    navigation.formData?.get("intent") === "remove"
      ? Number(navigation.formData.get("id"))
      : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          My team
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {members.length} of {MAX_TEAM_SIZE} slots filled. Your team is saved
          in a cookie and rendered on the server, so it's here on first load.
        </p>
      </header>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-lg font-medium">Your team is empty.</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Open any Pokémon and choose “Add to team”.{" "}
            <Link
              to="/"
              className="font-medium text-red-700 underline dark:text-red-400"
            >
              Browse the Pokédex
            </Link>
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const name = formatName(member.name);
            return (
              <li
                key={member.id}
                className={`flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${removingId === member.id ? "opacity-50" : ""}`}
              >
                <img
                  src={spriteUrl(member.id)}
                  alt=""
                  width={72}
                  height={72}
                  className="size-18 [image-rendering:pixelated]"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {formatDexNumber(member.id)}
                  </p>
                  <Link
                    to={`/pokemon/${member.name}`}
                    className="font-semibold hover:underline"
                  >
                    {name}
                  </Link>
                  <div className="flex gap-1.5">
                    {member.types.map((type) => (
                      <TypeBadge key={type} type={type} />
                    ))}
                  </div>
                </div>
                {/* Plain <Form>: posts to this route's action and works without JS */}
                <Form method="post">
                  <input type="hidden" name="id" value={member.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="remove"
                    aria-label={`Remove ${name} from team`}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Remove
                  </button>
                </Form>
              </li>
            );
          })}
        </ul>
      )}

      {members.length > 0 && (
        <section aria-labelledby="coverage-heading" className="space-y-3">
          <h2 id="coverage-heading" className="text-xl font-semibold">
            Type coverage
          </h2>
          {missing.length === 0 ? (
            <p>Your team covers all 18 types. Impressive!</p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                No team member has these types yet:
              </p>
              <ul className="flex flex-wrap gap-2">
                {missing.map((type) => (
                  <li key={type}>
                    <TypeBadge type={type} linked />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

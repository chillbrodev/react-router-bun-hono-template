import { useFetcher } from "react-router";
import { MAX_TEAM_SIZE } from "~/lib/pokemon";

/**
 * Adds or removes a Pokémon from the team.
 *
 * It's a real `<form method="post">`, so it works before hydration and with
 * JavaScript disabled. Once hydrated, `useFetcher` submits it in the
 * background and shows the result optimistically.
 */
export function TeamToggle({
  id,
  name,
  onTeam,
  teamFull,
}: {
  id: number;
  name: string;
  onTeam: boolean;
  teamFull: boolean;
}) {
  const fetcher = useFetcher<{ ok: boolean; error: string | null }>();

  // Optimistic UI: reflect the pending submission before the server responds
  const pendingIntent = fetcher.formData?.get("intent");
  const showOnTeam = pendingIntent ? pendingIntent === "add" : onTeam;
  const error = fetcher.state === "idle" ? fetcher.data?.error : null;

  return (
    <fetcher.Form method="post" className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        name="intent"
        value={showOnTeam ? "remove" : "add"}
        disabled={!showOnTeam && teamFull}
        className={`rounded-xl px-5 py-2.5 font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 ${
          showOnTeam
            ? "border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {showOnTeam ? `Remove ${name} from team` : `Add ${name} to team`}
      </button>
      <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
        {error ??
          (!showOnTeam && teamFull
            ? `Your team is full (${MAX_TEAM_SIZE} max).`
            : showOnTeam
              ? "On your team ✓"
              : "")}
      </p>
    </fetcher.Form>
  );
}

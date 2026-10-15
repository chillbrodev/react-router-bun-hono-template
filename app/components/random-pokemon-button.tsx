import { useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "~/lib/api-client";

/** Calls the Hono API from the browser with the type-safe `hc` client. */
export function RandomPokemonButton() {
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await apiClient.pokemon.random.$get();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pokemon = await res.json();
      await navigate(`/pokemon/${pokemon.name}`);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading"}
        className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
      >
        {state === "loading" ? "Finding one…" : "🎲 Surprise me"}
      </button>
      <p role="status" className="text-sm text-red-700 dark:text-red-400">
        {state === "error" ? "Couldn't pick a Pokémon. Try again." : ""}
      </p>
    </div>
  );
}

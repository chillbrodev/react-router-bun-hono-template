import { formatStatName } from "~/lib/pokemon";

// Highest base stat in the games (Blissey's HP).
const MAX_STAT = 255;

function barColor(value: number) {
  if (value >= 120) return "bg-emerald-500";
  if (value >= 80) return "bg-lime-500";
  if (value >= 50) return "bg-amber-400";
  return "bg-rose-500";
}

export function StatBar({ name, value }: { name: string; value: number }) {
  const label = formatStatName(name);

  return (
    <div className="grid grid-cols-[5rem_2.5rem_1fr] items-center gap-3">
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </dt>
      <dd className="text-right font-mono text-sm font-semibold tabular-nums">
        {value}
      </dd>
      <dd>
        <meter
          className="sr-only"
          min={0}
          max={MAX_STAT}
          value={value}
          aria-label={`${label} ${value} of ${MAX_STAT}`}
        />
        <div
          aria-hidden="true"
          className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
        >
          <div
            className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 ${barColor(value)}`}
            style={{ width: `${Math.min(100, (value / MAX_STAT) * 100)}%` }}
          />
        </div>
      </dd>
    </div>
  );
}

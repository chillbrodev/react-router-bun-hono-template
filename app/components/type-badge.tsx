import { Link } from "react-router";
import { formatName, type PokemonType, TYPE_STYLES } from "~/lib/pokemon";

const BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase";

export function TypeBadge({
  type,
  linked = false,
}: {
  type: PokemonType;
  linked?: boolean;
}) {
  const className = `${BASE} ${TYPE_STYLES[type]}`;

  if (!linked) return <span className={className}>{formatName(type)}</span>;

  return (
    <Link
      to={`/?type=${type}`}
      className={`${className} hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600`}
      aria-label={`Browse ${formatName(type)} type Pokémon`}
    >
      {formatName(type)}
    </Link>
  );
}

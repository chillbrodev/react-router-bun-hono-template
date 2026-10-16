import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("pokemon/:name", "routes/pokemon.tsx"),
  route("team", "routes/team.tsx"),
] satisfies RouteConfig;

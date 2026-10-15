import { createHonoServer } from "react-router-hono-server/cloudflare";
import { type AppEnv, configure, getLoadContext } from "./app";

export default await createHonoServer<AppEnv>({ configure, getLoadContext });

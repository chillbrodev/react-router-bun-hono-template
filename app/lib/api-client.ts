import { hc } from "hono/client";
import type { Api } from "~/server/api";

/**
 * Type-safe client for the Hono API in `~/server/api`.
 *
 * Only the `Api` *type* is imported, so no server code reaches the browser,
 * yet paths, query params and response shapes are all checked by TypeScript.
 */
export const apiClient = hc<Api>("/api");

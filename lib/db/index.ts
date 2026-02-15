import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "path";
import * as schema from "./schema";

const defaultUrl =
  typeof process !== "undefined" && process.cwd
    ? `file:${path.join(process.cwd(), "data", "local.db")}`
    : "file:./data/local.db";
const url = process.env.TURSO_DATABASE_URL ?? defaultUrl;
const authToken = process.env.TURSO_AUTH_TOKEN ?? undefined;

const isRemote = url.startsWith("libsql://");
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  const safeUrl = isRemote ? url.replace(/\/\/[^@]+@/, "//***@") : url;
  console.log(`[DB] Using ${isRemote ? "REMOTE Turso" : "LOCAL file"}: ${safeUrl}`);
}

export const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });

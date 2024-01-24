import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "@telegram/env";

declare global {
  var pool: Pool;
  var db: NodePgDatabase<typeof schema>;
}

if (!globalThis.pool) {
  console.log("Creating pool");
  globalThis.pool = new Pool({
    connectionString: env.DB_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    idleTimeoutMillis: 1000 * 60 * 60,
  });

  globalThis.pool.on("connect", () => {
    console.log("Connecting");
  });
}

export const pool = globalThis.pool;

if (!globalThis.db) {
  console.log("Creating db");
  globalThis.db = drizzle(pool, { schema });
}

globalThis.pool = pool;

export const db = globalThis.db;

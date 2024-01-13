import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString:
    "postgresql://winnpg:8bWv0%28%3FuasY4.r%3Ff1-eV9gM7@100.116.166.118:5432/pgwinn",
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });

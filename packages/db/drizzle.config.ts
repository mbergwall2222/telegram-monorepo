import { env } from '@telegram/env';
import type { Config } from 'drizzle-kit';
export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  
  dbCredentials: {connectionString:
    env.DB_CONNECTION_STRING}
} satisfies Config;
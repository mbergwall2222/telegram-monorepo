import type { Config } from 'drizzle-kit';
export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  
  dbCredentials: {connectionString:
    "postgresql://winnpg:8bWv0%28%3FuasY4.r%3Ff1-eV9gM7@100.116.166.118:5432/pgwinn"}
} satisfies Config;
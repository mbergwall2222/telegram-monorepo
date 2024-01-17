import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";

let envSchema = z.object({
  SESSION: z.string().min(1),
  SPACES_ACCESS_KEY: z.string().min(1),
  SPACES_SECRET_KEY: z.string().min(1),
  NODE_ENV: z.string().default("development"),
  PUSHER_APP_ID: z.string().min(1),
  PUSHER_KEY: z.string().min(1),
  PUSHER_SECRET: z.string().min(1),
  PUSHER_CLUSTER: z.string().min(1),
  PUSHER_USE_TLS: z.coerce.boolean(),
  REDIS_URL: z.string().min(1),
  REDIS_DB: z.coerce.number().default(0),
  TELEGRAM_API_ID: z.coerce.number().min(1),
  TELEGRAM_APP_HASH: z.string().min(1),
  KAFKA_MESSAGES_TOPIC: z.string().min(1),
  DB_CONNECTION_STRING: z.string().min(1),
});

let _env: z.infer<typeof envSchema>;

try {
  _env = envSchema.parse(Bun.env);
} catch (err: any) {
  const validationError = fromZodError(err);
  console.error(`[env] ${validationError.toString()}`);
  process.exit(1);
}

export const env = _env;
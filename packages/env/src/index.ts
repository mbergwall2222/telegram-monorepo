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
  KAFKA_DATA_TOPIC: z.string().min(1),
  DB_CONNECTION_STRING: z.string().min(1),
  KAFKA_CONSUMER_GROUP_ID: z.string().min(1),
  QDRANT_COLLECTIONS_NAME: z.string().min(1),
});

let _env: z.infer<typeof envSchema>;

try {
  let env = typeof Bun == "undefined" ? process.env : Bun.env;
  _env = envSchema.parse(env);
} catch (err) {
  console.log(err);
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    console.error(`[env] ${validationError.toString()}`);
  } else {
    console.error(`[env] ${err}`);
  }
  process.exit(1);
}

export const env = _env;

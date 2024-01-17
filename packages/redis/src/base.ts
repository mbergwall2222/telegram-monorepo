import { createClient } from "redis";
import { env } from "@telegram/env";

export const redisBase = createClient({
  url: env.REDIS_URL,
});

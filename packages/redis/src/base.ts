import { createClient } from "redis";

export const redisBase = createClient({
  url: "redis://dragonfly.redis.svc.cluster.local:6379",
});

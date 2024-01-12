import { createClient } from "redis";

export const redisBase = createClient({
  url: "rediss://default:576f21cd10ab41ccb16c9e84504c3cdd@us1-eager-lobster-41794.upstash.io:41794",
});

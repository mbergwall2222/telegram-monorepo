import { env } from "@telegram/env";
import { redisBase } from "./base";

const _redis = await redisBase
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

await _redis.select(env.REDIS_DB);

export const redis = _redis;

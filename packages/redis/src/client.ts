import { redisBase } from "./base";

export const redis = await redisBase
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

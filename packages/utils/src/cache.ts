import { redis } from "@telegram/redis";
import objectHash from "object-hash";
import ADLER32 from "adler-32";
import { logger } from "@telegram/logger";

export const getFileId = (fileId: string) => redis.get(`file:${fileId}`);

export const hash = (obj: objectHash.NotUndefined) =>
  ADLER32.str(objectHash(obj, { algorithm: "passthrough" })).toString();

export const doesHashMatch = async (
  id: string,
  obj: objectHash.NotUndefined,
  prefix = "chat"
) => {
  let objHash = await redis.get(`${prefix}:${id}:hash`);
  if (!objHash) return false;

  let newHash = hash(obj);
  logger.debug({ id, objHash, newHash }, "Checking if hash matches");
  return objHash == newHash;
};

export const setHash = async (
  id: string,
  obj: objectHash.NotUndefined,
  prefix = "chat"
) => {
  logger.debug({ id, obj }, "Checking if hash matches");

  await redis.set(`${prefix}:${id}:hash`, hash(obj));
};

export const _isCached = async (prefix: string, id: string) => {
  return await redis.exists(`${prefix}:${id}:cache`);
};

export const isUserCached = async (id: string) => {
  return true;
  return await _isCached("user", id);
};

export const isChatCached = async (id: string) => {
  return true;
  return await _isCached("chat", id);
};

export const _setCached = async (prefix: string, id: string) => {
  await redis.set(`${prefix}:${id}:cache`, "true");
  return redis.expire(`${prefix}:${id}:cache`, 60 * 60 * 24);
};

export const setUserCached = async (id: string) => {
  await _setCached("user", id);
};

export const setChatCached = async (id: string) => {
  await _setCached("chat", id);
};

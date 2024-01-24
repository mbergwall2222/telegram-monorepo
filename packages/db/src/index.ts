export * from "./db";
export * from "./schema";
export * from "drizzle-orm";
export * as PGCore from "drizzle-orm/pg-core";

export function keysFromObject<T extends object>(object: T): (keyof T)[] {
  return Object.keys(object) as (keyof T)[];
}

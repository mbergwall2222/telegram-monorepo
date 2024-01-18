export * from "./db";
export * from "./schema";
export { sql } from "drizzle-orm";

export function keysFromObject<T extends object>(object: T): (keyof T)[] {
  return Object.keys(object) as (keyof T)[];
}

export function toValidUTF8(str: string | undefined | null | { id: string }) {
  if (!str) return str;
  if (typeof str == "object") str = str.id;
  return Buffer.from(str, "utf-8").toString();
}

export function stringToShardKey(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % 10; // 11 because we want numbers between 0 and 10
}

export function ensureString(str: any) {
  if (!str) return str;
  if (typeof str == "number") return str.toString();
  return str;
}

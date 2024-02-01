import { type ClassValue, clsx } from "clsx";
import { Cookies } from "next-client-cookies";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  const vc = process.env.VERCEL_URL;
  if (vc) return `https://${vc}`;
  return "http://localhost:3000";
}

export const getLayoutSizes = (cookies: Cookies) => {
  const layout = cookies.get("layout");
  if (!layout) return [30, 70];
  return JSON.parse(layout);
};

export const valueFormatter = (number: number) =>
  `${Intl.NumberFormat("us").format(number).toString()}`;

export function convertToRecordOfString(
  input: Record<string, string | number | undefined>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in input) {
    if (input[key]) result[key] = String(input[key]);
  }
  return result;
}

export function objectToURLSearchParams(obj: Record<string, any>) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.append(key, value);
    }
  });
  return params;
}

export function replaceNullStrings(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(o => replaceNullStrings(o));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    acc[key] = value === "null" ? null : replaceNullStrings(value);
    return acc;
  }, {} as Record<string, any>);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

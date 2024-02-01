import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { z } from "zod";
import { ColumnFilterStateSchema, coerceToStringArray } from "../table";
import { createParser } from "next-usequerystate";
import { ColumnFiltersState } from "@tanstack/react-table";

type ColumnFilterState = z.infer<typeof ColumnFilterStateSchema>;
export const compressFilter = (data: ColumnFilterState | undefined) => {
  let compactData =
    data
      ?.map((item) => {
        const coercedValue = coerceToStringArray(item.value);
        if (!coercedValue) return `${item.id}:$${JSON.stringify(item.value)}`;

        return `${item.id}:${coercedValue.join(",")}`;
      })
      ?.join("|") ?? "";

  return compressToEncodedURIComponent(compactData);
};

const decompressFilter = (data: string | undefined) => {
  const compactData = decompressFromEncodedURIComponent(data ?? "");

  console.log("compactData", compactData);
  // Convert back to the original format
  return compactData?.split("|").map((item) => {
    let [id, values] = item.split(":");
    if (values && values[0] === "$") {
      values = item.split(":").slice(1).join(":").slice(1);
      return { id, value: JSON.parse(values) };
    }

    return { id, value: values.split(",") };
  });
};

export function parseAsFilterState() {
  return createParser({
    parse: (query) => {
      console.log("PARSING STATE");
      try {
        console.log("query", query);
        const obj = decompressFilter(query);
        console.log("obj", obj);
        return ColumnFilterStateSchema.parse(obj) as ColumnFiltersState;
      } catch (e) {
        console.log("error", e);
        return null;
      }
    },
    serialize: (value: ColumnFiltersState) => compressFilter(value as any),
  });
}

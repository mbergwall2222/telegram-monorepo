import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { z } from "zod";
import {
  ColumnFilterStateSchema,
  ColumnSortSchema,
  SortingStateSchema,
  coerceToStringArray,
} from "../table";
import { createParser } from "next-usequerystate";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";

type ColumnSortState = z.infer<typeof SortingStateSchema>;
const compressSort = (data: ColumnSortState) => {
  let compactData = data
    .map((item) => {
      return `${item.id}:${item.desc ? 1 : 0}`;
    })
    .join("|");

  return compressToEncodedURIComponent(compactData);
};

const decompressSort = (data: string) => {
  const compactData = decompressFromEncodedURIComponent(data);

  // Convert back to the original format
  return compactData.split("|").map((item) => {
    let [id, descInt] = item.split(":");
    return { id, desc: descInt == "1" };
  });
};

export function parseAsSortState() {
  return createParser({
    parse: (query) => {
      try {
        const obj = decompressSort(query);
        return SortingStateSchema.parse(obj) as SortingState;
      } catch {
        return null;
      }
    },
    serialize: (value: SortingState) => compressSort(value),
  });
}

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { z } from "zod";
import {
  ColumnFilterStateSchema,
  PaginationStateSchema,
  coerceToStringArray,
} from "../table";
import { createParser } from "next-usequerystate";
import { ColumnFiltersState, PaginationState } from "@tanstack/react-table";

type PaginationStateType = z.infer<typeof PaginationStateSchema>;
const compress = (data: PaginationStateType) => {
  const compactData = `${data.pageSize}|${data.pageIndex}`;

  return compressToEncodedURIComponent(compactData);
};

const decompress = (data: string) => {
  const compactData = decompressFromEncodedURIComponent(data);

  // Convert back to the original format
  const [pageSize, pageIndex] = compactData.split("|");
  return { pageIndex, pageSize };
};

export function parseAsPaginationState() {
  return createParser({
    parse: (query) => {
      try {
        const obj = decompress(query);
        return PaginationStateSchema.parse(obj) as PaginationState;
      } catch {
        return null;
      }
    },
    serialize: (value: PaginationState) => compress(value),
  });
}

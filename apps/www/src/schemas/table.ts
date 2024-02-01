import { z } from "zod";
import { pageSizeSchema } from "./getMessages";

export const ColumnSortSchema = z.object({
  desc: z.boolean(),
  id: z.string(),
});

export const SortingStateSchema = z.array(ColumnSortSchema);

export const FilterValue = z.union([z.string(), z.array(z.string())]);

export const coerceToStringArray = (value: unknown): string[] | false => {
  console.log("value", value);
  const result = FilterValue.safeParse(value);
  if (result.success) {
    console.log("value", value, "result", result);
    return Array.isArray(result.data) ? result.data : [result.data];
  } else {
    // Handle the case where value is neither a string nor an array of strings
    return false; // or throw an error, depending on your needs
  }
};

export const ColumnFilterSchema = z
  .object({
    value: z.unknown(),
    id: z.string(),
  })
  .strict();

export const ColumnFilterStateSchema = z.array(ColumnFilterSchema);

export const PaginationStateSchema = z.object({
  pageSize: pageSizeSchema,
  pageIndex: z.coerce
    .number()
    .min(0)
    .max(9999)
    .default(0),
});

const stringFilterIsNullSchema = z.object({
  isNull: z.literal(true).optional(),
});

const stringFilterIsNotNullSchema = z.object({
  isNull: z.literal(false),
  minLength: z
    .number()
    .min(0)
    .optional(),
  maxLength: z
    .number()
    .min(0)
    .optional(),
  keyword: z
    .string()
    .min(4)
    .optional(),
});

export const stringFilterSchema = z.union([
  stringFilterIsNullSchema,
  stringFilterIsNotNullSchema,
]);

export type StringFilterType = z.infer<typeof stringFilterSchema>;

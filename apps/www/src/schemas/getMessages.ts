import {
  coerceToArray,
  makeSearchParamsObjSchema,
} from "@/lib/makeSearchParamsObjectSchema";
import { ZodObject, ZodRawShape, z } from "zod";
import { messagesColumnsWithLinkedEnum, messagesEnum } from "./enums";

const cursorSchema = z.string();
export const offsetSchema = z.coerce
  .number()
  .min(0)
  // .max(99000)
  .default(0);
export const pageSizeSchema = z.coerce.number().min(1).max(100).default(10);
const sortColumnSchema = messagesColumnsWithLinkedEnum;
const sortDirSchema = z.union([z.literal("asc"), z.literal("desc")]);

export const filterSchema = z.object({
  chats: coerceToArray(z.coerce.string().array()).optional(),
  users: coerceToArray(z.coerce.string().array()).optional(),
  tags: coerceToArray(z.coerce.string().array()).optional(),
  userTags: coerceToArray(z.coerce.string().array()).optional(),
  chatTags: coerceToArray(z.coerce.string().array()).optional(),
  messageText: z.string().optional(),
  chat_isGroup: z.boolean().optional(),
  chat_isChannel: z.boolean().optional(),
});

// Sort schema
export const sortSchema = z
  .union([
    z.object({
      sortColumn: messagesEnum,
      sortDir: sortDirSchema,
    }),
    z.object({}),
  ])
  .and(filterSchema);

// Schema where cursor exists but offset and pageSize do not
const cursorOnlySchema = z
  .object({
    cursor: cursorSchema.optional(),
    offset: z.undefined(),
    pageSize: z.undefined(),
  })
  .and(sortSchema);

// Schema where offset and pageSize exist but cursor does not
const offsetPageSizeSchema = z
  .object({
    cursor: z.undefined(),
    offset: offsetSchema,
    pageSize: pageSizeSchema,
  })
  .and(sortSchema);

// Combined schema using union
export const getMessagesSchema = z.union([
  cursorOnlySchema,
  offsetPageSizeSchema,
  // z.object({}).strict(),
]);

export type GetMessagesParams = z.infer<typeof getMessagesSchema>;

export const getMessagesSearchParamsSchema = makeSearchParamsObjSchema(
  getMessagesSchema as unknown as ZodObject<ZodRawShape>
);

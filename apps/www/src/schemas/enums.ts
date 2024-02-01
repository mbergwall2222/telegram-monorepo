import { MessagesRecord } from "@/lib/xata";
import { ColumnsByValue } from "@xata.io/client";
import { z } from "zod";

export const messagesEnum = z.enum([
  "id",
  "date",
  "messageId",
  "messageText",
  "groupId",
  "inReplyToId",
]);
export const usersEnum = z.enum([
  "id",
  "userId",
  "firstName",
  "lastName",
  "username",
  "pfpUrl",
  "description",
]);
export const chatsEnum = z.enum([
  "id",
  "isGroup",
  "isChannel",
  "title",
  "memberCount",
  "pfpUrl",
  "lastMessageDate",
  "description",
]);
export const documentsEnum = z.enum([
  "id",
  "fileId",
  "fileName",
  "fileSize",
  "mimeType",
  "fileUrl",
]);
export const tagsEnum = z.enum(["id", "description", "variant", "order"]);

// Create tuples for prefixed enums
const usersEnumPrefixed = usersEnum.options.map((o) => `user.${o}` as const);
const chatsEnumPrefixed = chatsEnum.options.map((o) => `chat.${o}` as const);
const documentsEnumPrefixed = documentsEnum.options.map(
  (o) => `document.${o}` as const
);
// const tagsEnumPrefixed = tagsEnum.options.map((o) => `tag.${o}` as const);

// Create the combined enum as a tuple
export const messagesColumnsWithLinkedEnum = z.enum([
  ...messagesEnum.options,
  ...usersEnumPrefixed,
  ...chatsEnumPrefixed,
  ...documentsEnumPrefixed,
  // ...tagsEnumPrefixed,
] as const);

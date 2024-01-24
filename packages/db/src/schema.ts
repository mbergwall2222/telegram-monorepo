import {
  boolean,
  index,
  integer,
  json,
  pgMaterializedView,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
export const telegramSchema = pgSchema("telegram");

export const users = telegramSchema.table(
  "users",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: text("username"),
    pfpUrl: text("pfp_url"),
    description: text("description"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      idIdx: uniqueIndex("users_id_idx").on(table.userId),
    };
  }
);

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  tags: many(tagsToUsers),
}));

export const chats = telegramSchema.table(
  "chats",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    telegramId: text("telegram_id").notNull(),
    isGroup: boolean("is_group").notNull(),
    isChannel: boolean("is_channel").notNull(),
    title: text("title"),
    memberCount: text("member_count"),
    pfpUrl: text("pfp_url"),
    lastMessageDate: timestamp("last_message_date")
      .notNull()
      .$defaultFn(() => new Date()),
    description: text("description"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      idIdx: uniqueIndex("chats_id_idx").on(table.telegramId),
      lastMessageDateIdx: index("chats_last_message_date_idx").on(
        table.lastMessageDate
      ),
    };
  }
);

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  tags: many(tagsToChats),
}));

export const messages = telegramSchema.table(
  "messages",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    date: timestamp("date").notNull(),
    messageId: text("message_id").notNull(),
    messageText: text("message_text"),
    groupId: text("group_id"),
    inReplyToId: text("in_reply_to_id"),
    entities: json("entities"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id),
    userId: text("user_id").references(() => users.id),
    documentId: text("document_id").references(() => documents.id),
  },
  (table) => {
    return {
      globalDateIdx: index("messages_global_date_idx").on(table.date),
      chatIdx: index("messages_chat_idx").on(table.chatId, table.date),
      userIdx: index("messages_user_idx").on(table.userId, table.date),
      replyIdx: index("messages_reply_idx").on(
        table.chatId,
        table.inReplyToId,
        table.date
      ),
      idIdx: uniqueIndex("messages_id_idx").on(table.chatId, table.messageId),
    };
  }
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  tags: many(tagsToMessages),
  document: one(documents, {
    fields: [messages.documentId],
    references: [documents.id],
  }),
}));

export const documents = telegramSchema.table("documents", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  fileId: text("file_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size"),
  mimeType: text("mime_type").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const tags = telegramSchema.table("tags", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  variant: text("variant"),
  order: integer("order")
    .notNull()
    .$default(() => 0),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  messages: many(tagsToMessages),
  users: many(tagsToUsers),
  chats: many(tagsToChats),
}));

export const tagsToMessages = telegramSchema.table(
  "tags_to_messages",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tagId, t.messageId] }),
    tagsToMessageIdx: index("tags_to_messages_idx").on(t.messageId),
  })
);

export const tagsToMessagesRelations = relations(tagsToMessages, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToMessages.tagId],
    references: [tags.id],
  }),
  message: one(messages, {
    fields: [tagsToMessages.messageId],
    references: [messages.id],
  }),
}));

export const tagsToUsers = telegramSchema.table(
  "tags_to_users",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tagId, t.userId] }),
    tagsToUserIdx: index("tags_to_users_idx").on(t.userId),
  })
);

export const tagsToUsersRelations = relations(tagsToUsers, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToUsers.tagId],
    references: [tags.id],
  }),
  user: one(users, {
    fields: [tagsToUsers.userId],
    references: [users.id],
  }),
}));

export const tagsToChats = telegramSchema.table(
  "tags_to_chats",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tagId, t.chatId] }),
    tagsToChatIdx: index("tags_to_chats_idx").on(t.chatId),
  })
);

export const tagsToChatsRelations = relations(tagsToChats, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToChats.tagId],
    references: [tags.id],
  }),
  chat: one(chats, {
    fields: [tagsToChats.chatId],
    references: [chats.id],
  }),
}));

export const savedFilters = telegramSchema.table("saved_filters", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  params: text("params").notNull(),
  userId: text("user_id").notNull(),
  orgId: text("org_id").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const userSummary = telegramSchema
  .view("user_summary", {
    id: text("id").primaryKey(),
    chatsList: json("chatslist").$type<{ id: string; title: string }[]>(),
    chatCount: integer("chatcount"),
    messageCount: integer("messagecount"),
  })
  .existing();

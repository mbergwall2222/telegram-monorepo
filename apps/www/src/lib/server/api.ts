import "server-only";

import { buildTags } from "../tags";
import {
  db,
  desc,
  chats,
  eq,
  tagsToChats,
  and,
  tagsToUsers,
  tagsToMessages,
  tags,
  messages,
  inArray,
  users,
} from "@telegram/db";
import { env } from "@/env.mjs";
import { ITag } from "../types/tags";
import { IMessage } from "../types/messages";
import { IUser } from "../types/users";
import { revalidateTag, unstable_cache } from "next/cache";
import { elasticClient } from "./elastic";


export const _getTags = async () => {
  const tags = await db.query.tagsToChats.findMany({ with: { tag: true } });
  return buildTags(tags);
};

export const getTags = unstable_cache(async () => _getTags(), ["tags"], {tags: ["tags"], revalidate: 60 * 60 * 24 * 7});

export const getChat = async (id: string) => {
  const chat = await db.query.chats.findFirst({ where: eq(chats.id, id) });
  return chat;
};

export const _getChats = async (cursor?: number | null) => {
  const chatsRaw = await db.query.chats.findMany({
    orderBy: [desc(chats.lastMessageDate)],
    offset: cursor ?? 0,
    limit: 20,
  });
  return chatsRaw;
};

export const getChats = (cursor?: number | null) => unstable_cache(async (cursor?: number | null) => _getChats(cursor), ["chats"], {tags: ["chats"], revalidate: 60})(cursor);

export const searchForChats = async (query: string, offset?: number) => {
  const chats = await elasticClient.search<{
    id: string;
    telegram_id: string;
    is_group: boolean;
    is_channel: boolean;
    title: string;
    member_count: number | null;
    pfp_url: string | null;
    last_message_date: number;
    description: string | null;
    created_at: number | null;
  }>({
    index: `${env.ELASTICSEARCH_PREFIX}.telegram.chats`,
    query: {
      simple_query_string: {
        query: `${query}*`,
        fields: ["title^5", "description"],
        default_operator: "and",
      },
    },
  });

  return chats;
};

export const searchForTags = async (query: string, offset?: number) => {
  const tags = await elasticClient.search<ITag>({
    index: `${env.ELASTICSEARCH_PREFIX}.telegram.tags`,
    query: {
      simple_query_string: {
        query: `${query}*`,
        fields: ["name"],
        default_operator: "and",
      },
    },
  });

  return tags.hits.hits.map((o) => o._source);
};
export const searchForChatMessages = async (
  chatId: string,
  query: string,
  offset?: number
) => {
  const messages = await elasticClient.search<IMessage>({
    index: `${env.ELASTICSEARCH_PREFIX}.telegram.messages`,
    query: {
      bool: {
        must: {
          simple_query_string: {
            query: `${query}*`,
            fields: ["message_text"],
            default_operator: "and",
          },
        },
        filter: {
          term: { chat_id: chatId },
        },
      },
    },
  });

  return messages.hits.hits.map((o) => o._source);
};

export const searchForMessages = async (query: string, offset?: number) => {
  const messages = await elasticClient.search<IMessage>({
    index: `${env.ELASTICSEARCH_PREFIX}.telegram.messages`,
    query: {
      simple_query_string: {
        query: `${query}*`,
        fields: ["message_text"],
        default_operator: "and",
      },
    },
  });

  return messages.hits.hits.map((o) => o._source);
};

export const searchForUsers = async (query: string, offset?: number) => {
  const users = await elasticClient.search<{
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    pfp_url: string;
    description: string | null;
    created_at: number;
  }>({
    index: `${env.ELASTICSEARCH_PREFIX}.telegram.users`,
    query: {
      simple_query_string: {
        query: `${query}*`,
        fields: ["first_name^5", "last_name^5", "username"],
        default_operator: "and",
      },
    },
  });

  return users.hits.hits.map((o) => o._source);
};

export const _getChatTags = async (id: string) => {
  const tags = await db.query.tagsToChats.findMany({
    where: eq(tagsToChats.chatId, id),
    with: { tag: true },
  });

  return tags;
};

export const getChatTags = (id: string) => unstable_cache(async (id: string) => _getChatTags(id), ["tags", "chat"], {tags: [`chat|${id}`]})(id);

export const _getAllTags = async () => {
  const tags = await db.query.tags.findMany({});

  return tags;
};

export const getAllTags = unstable_cache(async () => _getAllTags(), ["tags"], {tags: ["tags"], revalidate: 60 * 60 * 24 * 7});

export const unlinkChatTags = async (tagId: string, chatId: string) => {
  revalidateTag(`chat|${chatId}`);
  return db
    .delete(tagsToChats)
    .where(and(eq(tagsToChats.tagId, tagId), eq(tagsToChats.chatId, chatId)));
};

export const unlinkUserTags = async (tagId: string, userId: string) => {
  revalidateTag(`user|${userId}`);

  return db
    .delete(tagsToUsers)
    .where(and(eq(tagsToUsers.tagId, tagId), eq(tagsToUsers.userId, userId)));
};

export const unlinkMessageTags = async (tagId: string, messageId: string) => {
  revalidateTag(`message|${messageId}`);
  return db
    .delete(tagsToMessages)
    .where(
      and(
        eq(tagsToMessages.tagId, tagId),
        eq(tagsToMessages.messageId, messageId)
      )
    );
};

export const createTag = (data: {
  name: string;
  description?: string;
  orgId: string;
}) => {
  revalidateTag("tags");
  return db
    .insert(tags)
    .values(data)
    .onConflictDoNothing()
    .returning();
};
export const linkChatTag = async (tagId: string, chatId: string) => {
  revalidateTag(`chat|${chatId}`);

  return db
    .insert(tagsToChats)
    .values({ tagId, chatId })
    .onConflictDoNothing()
    .returning();
};

export const linkUserTag = async (tagId: string, userId: string) => {
  revalidateTag(`user|${userId}`);
  return db
    .insert(tagsToUsers)
    .values({ tagId, userId })
    .onConflictDoNothing()
    .returning();
};

export const linkMessageTag = async (tagId: string, messageId: string) => {
  revalidateTag(`message|${messageId}`);
  return db
    .insert(tagsToMessages)
    .values({ tagId, messageId })
    .onConflictDoNothing()
    .returning();
};

export const _getChatMessages = async (
  chatId: string,
  cursor?: number | null,
  userId?: string | null
) => {

  return db.query.messages.findMany({
    where: userId
      ? and(eq(messages.userId, userId), eq(messages.chatId, chatId))
      : eq(messages.chatId, chatId),
    orderBy: [desc(messages.date)],
    with: {user: true, chat: true, document: true},
    limit: 10,
    offset: cursor ?? 0,
  });
};

export const getChatMessages = unstable_cache(async (chatId: string, cursor?: number | null, userId?: string | null) => _getChatMessages(chatId, cursor, userId), ["chat", "messages"], {revalidate: 60});

export const getMessage = async (messageId: string) => {
  return db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: { chat: true, user: true, document: true },
  });
};

export const _getUserTags = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { tags: true },
  });

  if (!user || !user.tags.length) return [];

  const userTags = await db.query.tags.findMany({
    where: inArray(tags.id, user.tags.map((o) => o.tagId)),
  });
  return userTags;
};

export const getUserTags = (id: string) => unstable_cache(async (id: string) => _getUserTags(id), ["tags", "user"], {tags: [`user|${id}`]})(id);

export const _getMessageTags = async (id: string) => {
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, id),
    with: { tags: true },
  });

  if (!message || !message.tags.length) return [];
  const messageTags = await db.query.tags.findMany({
    where: inArray(tags.id, message.tags.map((o) => o.tagId)),
  });
  return messageTags;
};

export const getMessageTags = (id: string) => unstable_cache(async (id: string) => _getMessageTags(id), ["tags", "message"], {tags: [`message|${id}`]})(id);


export * from "./getMessages";
export * from "./getUsers";

import { GetMessagesParams } from "@/schemas/getMessages";
import { Model, XataDialect } from "@xata.io/kysely";
import { Kysely } from "kysely";
import { IMessage } from "../types/messages";
import {
  db,
  sql,
  isNotNull,
  users,
  isNull,
  count,
  getTableColumns,
  gte,
  ilike,
  SQL,
  inArray,
  messages,
  exists,
  tagsToChats,
  and,
  eq,
  tagsToUsers,
  desc,
  userSummary,
  tagsToMessages,
  chats,
  documents,
} from "@telegram/db";
import { elasticClient } from "./elastic";
import { env } from "@/env.mjs";

const buildElasticQuery = (params: GetMessagesParams) => {
  let filters: Record<string, string | string[]> = {};

  if (params?.chats?.length) filters["chat_id"] = params.chats;

  if (params?.users?.length) filters["user_id"] = params.users;
  console.log(
    JSON.stringify({
      filter: Object.keys(filters).map((filter) => ({
        terms: {
          [filter]: filters[filter],
        },
      })),
    })
  );
  if (Object.keys(filters).length) {
    return {
      filter: Object.keys(filters).map((filter) => ({
        terms: {
          [filter]: filters[filter],
        },
      })),
    };
  }

  return {};
};

const createBaseMessagesQuery = async (
  params: GetMessagesParams
): Promise<[SQL<unknown>[] | false, Record<string, number> | undefined]> => {
  const filters: SQL[] = [];
  let scoreMatch: Record<string, number> | undefined = undefined;

  if (params?.chats?.length)
    filters.push(inArray(messages.chatId, params.chats));

  if (params?.users?.length)
    filters.push(inArray(messages.userId, params.users));

  if (params.tags?.length) {
    const tagsQuery = db
      .select()
      .from(tagsToMessages)
      .where(
        and(
          eq(tagsToMessages.messageId, messages.id),
          inArray(tagsToMessages.tagId, params.tags)
        )
      );
    filters.push(exists(tagsQuery));
  }

  if (params.userTags?.length) {
    const tagsQuery = db
      .select()
      .from(tagsToUsers)
      .where(
        and(
          eq(tagsToUsers.userId, messages.userId),
          inArray(tagsToUsers.tagId, params.userTags)
        )
      );
    filters.push(exists(tagsQuery));
  }

  if (params.chatTags?.length) {
    const tagsQuery = db
      .select()
      .from(tagsToChats)
      .where(
        and(
          eq(tagsToChats.chatId, messages.chatId),
          inArray(tagsToChats.tagId, params.chatTags)
        )
      );
    filters.push(exists(tagsQuery));
  }

  if (
    typeof params.chat_isGroup == "boolean" ||
    typeof params.chat_isChannel == "boolean"
  ) {
    let chatsVal: SQL | undefined;
    if (
      typeof params.chat_isGroup == "boolean" &&
      typeof params.chat_isChannel == "boolean"
    ) {
      chatsVal = and(
        eq(chats.isGroup, params.chat_isGroup),
        eq(chats.isChannel, params.chat_isChannel)
      ) as SQL;
    } else if (typeof params.chat_isGroup == "boolean") {
      chatsVal = eq(chats.isGroup, params.chat_isGroup);
    } else if (typeof params.chat_isChannel == "boolean") {
      chatsVal = eq(chats.isChannel, params.chat_isChannel);
    } else {
      chatsVal = undefined;
    }

    if (typeof chatsVal != "undefined") {
      const chatsQuery = db
        .select()
        .from(chats)
        .where(and(eq(chats.id, messages.chatId), chatsVal));
      filters.push(exists(chatsQuery));
    }
  }

  if (params.messageText) {
    console.log(
      JSON.stringify({
        bool: {
          must: {
            simple_query_string: {
              query: `${params.messageText}*`,
              fields: ["message_text"],
              default_operator: "and",
            },
          },
          ...buildElasticQuery(params),
        },
      })
    );
    const esResponse = await elasticClient.search<{ id: string }>({
      index: `${env.ELASTICSEARCH_PREFIX}.telegram.messages`,
      size: 1000,
      query: {
        bool: {
          should: params.messageText
            .split(" ")
            .map((q) => [
              {
                wildcard: {
                  message_text: {
                    value: `*${q}*`,
                  },
                },
              },
            ])
            .flat(),
          minimum_should_match: 1,
          ...buildElasticQuery(params),
        },
      },
    });

    const ids = esResponse.hits.hits
      .map((o) => o?._source?.id)
      .filter((o) => typeof o != "undefined") as string[];

    scoreMatch = {};
    esResponse.hits.hits.forEach((o) => {
      if (!o._id || !o._score) return;

      // @ts-expect-error not undefined
      scoreMatch[o._id] = o._score;
    });

    if (ids.length) {
      filters.push(inArray(messages.id, ids));
    } else {
      return [false as const, undefined];
    }
  }

  return [filters, scoreMatch] as const;
};

export const getMessages = async (params: GetMessagesParams) => {
  let [filters, scoreMatch] = await createBaseMessagesQuery(params);

  if (!filters) return { data: [], totalRecords: 0 };

  const countQueryPromise = db
    .select({ count: count() })
    .from(messages)
    .where(and(...filters))
    .execute();

  let query = db
    .select()
    .from(messages)
    .where(and(...filters))
    .$dynamic();

  let enrichedQuery = query
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .leftJoin(users, eq(messages.userId, users.id))
    .leftJoin(documents, eq(messages.documentId, documents.id));

  if ("sortColumn" in params && !scoreMatch) {
    let sortCol = params.sortColumn;
    enrichedQuery = enrichedQuery.orderBy(
      params.sortDir == "desc" ? desc(messages[sortCol]) : messages[sortCol]
    );
  }

  if (scoreMatch) {
    enrichedQuery = enrichedQuery.orderBy(
      sql.raw(
        `array_position(ARRAY[${Object.keys(scoreMatch)
          .map((key) => `'${key}'`)
          .join(",")}], "messages"."id")`
      )
    );
  }

  enrichedQuery = enrichedQuery
    .offset(params.offset ?? 0)
    .limit(params.pageSize ?? 10);

  const data = enrichedQuery.execute().then((res) =>
    res.map((o) => ({
      ...o.messages,
      user: o.users,
      chat: o.chats,
      document: o.documents,
    }))
  );

  const [_messages, _count] = await Promise.all([
    data as Promise<IMessage[]>,
    countQueryPromise as Promise<[{ count: number }]>,
  ]);
  return { data: _messages, totalRecords: _count[0].count };
};

import { GetMessagesParams } from "@/schemas/getMessages";
import { Model, XataDialect } from "@xata.io/kysely";
import { Kysely, ReferenceExpression, SelectQueryBuilder, sql } from "kysely";
import { IMessage } from "../types/messages";
import { GetUsersParams } from "@/schemas/getUsers";
import { IEnrichedUser, IUser } from "../types/users";
import { StringFilterType } from "@/schemas/table";
import {
  db,
  isNotNull,
  users,
  isNull,
  count,
  or,
  not,
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
} from "@telegram/db";

const handleStringFilter = (
  filter: StringFilterType,
  columnName: keyof typeof users.$inferSelect
) => {
  let filters: SQL[] = [];
  if (typeof filter.isNull === "boolean") {
    filters.push(
      (filter.isNull
        ? or(isNull(users[columnName]), eq(users[columnName], ""))
        : and(
            isNotNull(users[columnName]),
            not(eq(users[columnName], ""))
          )) as SQL<unknown>
    );
  }

  // if (filter.isNull === false && filter.minLength) {
  //   query = query.where(gte(users.firstName, filter.minLength));
  // }

  // if (filter.isNull === false && filter.maxLength) {
  //   query = query.where(column, "<=", filter.maxLength);
  // }

  if (filter.isNull === false && filter.keyword) {
    // users[columnName]
    filters.push(ilike(users[columnName], `%${filter.keyword}%`));
    // query = query.where(column, "ilike", `%${filter.keyword}%`);
  }

  return filters;
};
type valueof<T> = T[keyof T];

const createBaseUsersQuery = (params: GetUsersParams) => {
  const filters: SQL[] = [];

  let stringFilterColumns = ["pfpUrl", "firstName", "lastName", "username"];
  let isFiltering = false;
  stringFilterColumns.forEach((columnName) => {
    if (columnName in params) {
      filters.push(
        ...handleStringFilter(
          params[columnName as keyof typeof params] as StringFilterType,
          columnName as keyof typeof users.$inferSelect
        )
      );
      isFiltering = true;
    }
  });

  if (params?.users?.length) filters.push(inArray(users.id, params.users));

  if (params?.chats?.length) {
    console.log(params.chats);
    const messagesQuery = db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, users.id),
          inArray(messages.chatId, params.chats)
        )
      );
    console.log(messagesQuery.toSQL());
    filters.push(exists(messagesQuery));
  }

  if (params?.chatTags?.length) {
    const messagesQuery = db
      .select()
      .from(messages)
      .innerJoin(tagsToChats, eq(messages.chatId, tagsToChats.chatId))
      .where(
        and(
          eq(messages.userId, users.id),
          inArray(tagsToChats.tagId, params.chatTags)
        )
      );
    filters.push(exists(messagesQuery));
  }

  if (params?.tags?.length) {
    const tagsQuery = db
      .select()
      .from(tagsToUsers)
      .where(
        and(
          eq(tagsToUsers.userId, users.id),
          inArray(tagsToUsers.tagId, params.tags)
        )
      );
    filters.push(exists(tagsQuery));
  }

  if (!filters.length)
    filters.push(
      ...["firstName", "lastName", "username"]
        .map((o) => handleStringFilter({ isNull: false }, o as any))
        .flat()
    );

  return filters;
};

export const getUsers = async (params: GetUsersParams) => {
  let filters = createBaseUsersQuery(params);

  const countQueryPromise = db
    .select({ count: count() })
    .from(users)
    .where(and(...filters))
    .execute();

  let query = db
    .select()
    .from(users)
    .where(filters.length > 1 ? and(...filters) : filters[0] ?? undefined)
    .$dynamic();

  if ("sortColumn" in params) {
    let sortCol = params.sortColumn;
    query = query.orderBy(
      params.sortDir == "desc" ? desc(users[sortCol]) : users[sortCol]
    );
  }

  query = query.offset(params.offset ?? 0).limit(params.pageSize ?? 10);

  const queryRes = await query.execute();
  // return { users, totalCount: 0 };
  if (!queryRes.length) return { data: [], totalRecords: -1 };

  const enrichedQuery = db
    .select()
    .from(userSummary)
    .where(
      inArray(
        userSummary.id,
        queryRes.map((o) => o.id)
      )
    );

  let enrichedQueryPromise = enrichedQuery
    .execute()
    .then((userData) =>
      queryRes.map((user) => ({
        ...userData.find((o) => o.id === user.id),
        ...user,
      }))
    )
    .catch((e) => {
      console.log(`enriched query`, e);
    });

  const [enrichedUsers, _count] = await Promise.all([
    enrichedQueryPromise as Promise<IEnrichedUser[]>,
    countQueryPromise as Promise<[{ count: number }]>,
  ]);
  return { data: enrichedUsers, totalRecords: _count[0].count };
};

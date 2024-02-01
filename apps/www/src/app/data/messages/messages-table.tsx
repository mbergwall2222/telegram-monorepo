"use client";
import { columns } from "./columns";
import { DataTable } from "@/components/table/data-table";
import { StringFilterType } from "@/schemas/table";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { z } from "zod";
import { StringFilter } from "@/components/table/string-filter";
import { Separator } from "@/components/ui/separator";
import { ChatsFilter } from "./chats_filter";
import { UsersFilter } from "./users_filter";
import { TagsFilter } from "./tags_filter";
import {
  filterSchema,
  getMessagesSchema,
  sortSchema,
} from "@/schemas/getMessages";
import { IMessage } from "@/lib/types/messages";
import {
  getMessageSearches,
  getMessages,
  saveMessageSearch,
} from "@/lib/client/api";
import { TextFilter } from "./text_filter";
import { BooleanFilter } from "@/components/table/boolean-filter";
import { usePrevious } from "@uidotdev/usehooks";
import { useEffect } from "react";

const convertFilterState = (state: ColumnFiltersState) => {
  const filters: z.infer<typeof filterSchema> = {};

  const chatFilter = state.find((o) => o.id == "chat_id");
  if (chatFilter) filters["chats"] = chatFilter.value as string[];

  const userFilter = state.find((o) => o.id == "user_id");
  if (userFilter) filters["users"] = userFilter.value as string[];

  const messageTagsFilter = state.find((o) => o.id == "messageTags");
  if (messageTagsFilter) filters["tags"] = messageTagsFilter.value as string[];

  const userTagsFilter = state.find((o) => o.id == "userTags");
  if (userTagsFilter) filters["userTags"] = userTagsFilter.value as string[];

  const chatTagsFilter = state.find((o) => o.id == "chatTags");
  if (chatTagsFilter) filters["chatTags"] = chatTagsFilter.value as string[];

  const messageTextFilter = state.find((o) => o.id == "messageText");
  if (messageTextFilter)
    filters["messageText"] = messageTextFilter.value as string;

  const isGroupFilter = state.find((o) => o.id == "chat_isGroup");
  if (isGroupFilter) filters["chat_isGroup"] = isGroupFilter.value as boolean;

  const isChannelFilter = state.find((o) => o.id == "chat_isChannel");
  if (isChannelFilter)
    filters["chat_isChannel"] = isChannelFilter.value as boolean;

  return filters;
};

const Filters = ({ table }: { table: Table<IMessage> }) => {
  const isFilteringText = !!table.getColumn("messageText")?.getFilterValue();
  const previous = usePrevious(isFilteringText);

  useEffect(() => {
    if (previous != isFilteringText && isFilteringText) {
      table.setPageIndex(0);
      table.getColumn("messageTags")?.setFilterValue(undefined);
      table.getColumn("userTags")?.setFilterValue(undefined);
      table.getColumn("chatTags")?.setFilterValue(undefined);

      table.getColumn("chat_isGroup")?.setFilterValue(undefined);
      table.getColumn("chat_isChannel")?.setFilterValue(undefined);
    }
  }, [isFilteringText, previous]);
  return (
    <>
      <ChatsFilter column={table.getColumn("chat_id")} />
      <UsersFilter column={table.getColumn("user_id")} />
      {!isFilteringText && (
        <>
          <TagsFilter table={table} />
          <BooleanFilter
            title="Is in Group"
            column={table.getColumn("chat_isGroup")}
          />

          <BooleanFilter
            title="Is in Channel"
            column={table.getColumn("chat_isChannel")}
          />
        </>
      )}

      <TextFilter
        column={table.getColumn("messageText")}
        onChange={() => {
          table.setPageIndex(0);
        }}
      />
      <Separator orientation="vertical" className="h-4" />
    </>
  );
};

export function MessagesTable({}: {}) {
  return (
    <DataTable
      columns={columns}
      sortSchema={sortSchema}
      paramsSchema={getMessagesSchema}
      defaultSortingState={{ id: "date", desc: true }}
      queryKey="messages"
      convertFilterState={convertFilterState}
      getData={getMessages}
      Filters={Filters}
      searches={{
        queryKey: "saved-message-searches",
        getSearches: getMessageSearches,
        saveSearch: saveMessageSearch,
        entityType: "messages",
      }}
    />
  );
}

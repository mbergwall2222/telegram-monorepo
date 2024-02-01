"use client";

import { DataTableFacetedFilter } from "@/components/ui/data-table-filter";
import { getChats, searchForChats } from "@/lib/client/api";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Column } from "@tanstack/react-table";
import { useState } from "react";

interface ChatsFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
}
export const ChatsFilter = <TData, TValue>({
  column,
}: ChatsFilterProps<TData, TValue>) => {
  const [searchQuery, onSearchQuery] = useState("");

  const { data } = useQuery({
    queryKey: ["chats", searchQuery],
    staleTime: Infinity,
    queryFn: async () => {
      if (searchQuery.length) {
        const _data = await searchForChats(searchQuery);
        return _data.chats;
      } else {
        const _data = await getChats();
        return _data.chats;
      }
    },
  });
  return (
    <DataTableFacetedFilter
      onSearchQuery={onSearchQuery}
      column={column}
      title="Chat"
      options={
        data?.map((chat) => ({ label: chat.title, value: chat.id })) ?? []
      }
    />
  );
};

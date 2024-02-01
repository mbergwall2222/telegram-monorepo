"use client";

import { DataTableFacetedFilter } from "@/components/ui/data-table-filter";
import {
  getChats,
  getUsers,
  searchForChats,
  searchForUsers,
} from "@/lib/client/api";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Column } from "@tanstack/react-table";
import { useState } from "react";

interface UsersFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
}
export const UsersFilter = <TData, TValue>({
  column,
}: UsersFilterProps<TData, TValue>) => {
  const [searchQuery, onSearchQuery] = useState("");

  const { data } = useQuery({
    queryKey: ["users", searchQuery],
    staleTime: Infinity,
    queryFn: async () => {
      if (searchQuery.length) {
        const _data = await searchForUsers(searchQuery);
        return _data.users;
      } else {
        const _data = await getUsers({});
        return _data.data;
      }
    },
  });

  return (
    <DataTableFacetedFilter
      onSearchQuery={onSearchQuery}
      column={column}
      title="User"
      options={
        data?.map((user) => ({
          label: `${user.firstName ? user.firstName : ""}${
            user.lastName ? " " + user.lastName : ""
          }`,
          value: user.id,
          avatar: user.pfpUrl,
        })) ?? []
      }
    />
  );
};

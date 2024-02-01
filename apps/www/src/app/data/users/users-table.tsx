"use client";
import { columns } from "./columns";
import { DataTable } from "@/components/table/data-table";
import {
  sortSchema,
  getUsersSchema,
  filterSchema,
  stringFiltersSchema,
} from "@/schemas/getUsers";
import { StringFilterType } from "@/schemas/table";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { z } from "zod";
import { getUserSearches, getUsers, saveUserSearch } from "@/lib/client/api";
import { StringFilter } from "@/components/table/string-filter";
import { Separator } from "@/components/ui/separator";
import { ChatsFilter } from "./chats_filter";
import { UsersFilter } from "./users_filter";
import { TagsFilter } from "./tags_filter";
import { IEnrichedUser } from "@/lib/types/users";

const convertFilterState = (state: ColumnFiltersState) => {
  const filters: z.infer<typeof filterSchema> = {};
  type StringFilters = z.infer<typeof stringFiltersSchema>;

  const chatFilter = state.find((o) => o.id == "chats");
  if (chatFilter) filters["chats"] = chatFilter.value as string[];

  const userFilter = state.find((o) => o.id == "id");
  if (userFilter) filters["users"] = userFilter.value as string[];

  const userTagsFilter = state.find((o) => o.id == "tags");
  if (userTagsFilter) filters["tags"] = userTagsFilter.value as string[];

  const chatTagsFilter = state.find((o) => o.id == "chatTags");
  if (chatTagsFilter) filters["chatTags"] = chatTagsFilter.value as string[];

  const stringFilters: Array<keyof StringFilters> = [
    "pfpUrl",
    "username",
    "firstName",
    "lastName",
  ];

  stringFilters.forEach((filterString) => {
    const filter = state.find((o) => o.id == filterString);
    if (filter)
      filters[filterString] = JSON.stringify(filter.value) as StringFilterType;
  });

  return filters;
};

const Filters = ({ table }: { table: Table<IEnrichedUser> }) => {
  return (
    <>
      <StringFilter title="PFP" column={table.getColumn("pfpUrl")} />
      <StringFilter
        title="First Name"
        column={table.getColumn("firstName")}
        canFilterLike
      />
      <StringFilter
        title="Last Name"
        column={table.getColumn("lastName")}
        canFilterLike
      />
      <StringFilter
        title="Username"
        column={table.getColumn("username")}
        canFilterLike
      />
      <Separator orientation="vertical" className="h-4" />
      <ChatsFilter column={table.getColumn("chats")} />
      <UsersFilter column={table.getColumn("id")} />
      <TagsFilter table={table} />
      <Separator orientation="vertical" className="h-4" />
    </>
  );
};

export function UsersTable({  }: {}) {
  return (
    <DataTable
      columns={columns}
      sortSchema={sortSchema}
      paramsSchema={getUsersSchema}
      defaultSortingState={{ id: "id", desc: true }}
      queryKey="users"
      convertFilterState={convertFilterState}
      getData={getUsers}
      Filters={Filters}
      searches={{
        queryKey: "saved-user-searches",
        getSearches: getUserSearches,
        saveSearch: saveUserSearch,
        entityType: "users",
      }}
    />
  );
}

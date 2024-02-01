"use client";

import { DataTableFacetedFilter } from "@/components/ui/data-table-filter";
import { Input } from "@/components/ui/input";
import { getChats, searchForChats } from "@/lib/client/api";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Column } from "@tanstack/react-table";
import { useState } from "react";

interface ChatsFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  onChange?: (value: string) => void;
}
export const TextFilter = <TData, TValue>({
  column,
  onChange,
}: ChatsFilterProps<TData, TValue>) => {
  const value = (column?.getFilterValue() as string) ?? "";

  return (
    <Input
      placeholder="Search message text..."
      className="w-80 mx-2"
      value={value}
      onChange={(ev) => {
        column?.setFilterValue(
          ev.target.value?.length ? ev.target.value : undefined
        );
        onChange?.(ev.target.value);
      }}
    />
  );
};

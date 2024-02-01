"use client";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DataTableFacetedFilter,
  Option,
} from "@/components/ui/data-table-filter";
import {
  getAllTags,
  searchForTags,
} from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Column } from "@tanstack/react-table";
import { CheckIcon } from "lucide-react";
import React, { forwardRef } from "react";

interface TagsFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  ref?: React.ForwardedRef<HTMLInputElement>;
}
export const TagFilter = forwardRef<
  HTMLInputElement,
  TagsFilterProps<any, any>
>(({ column, title }: TagsFilterProps<any, any>, ref) => {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const [selectedOptions, setSelectedOptions] = React.useState<Option[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data } = useQuery({
    queryKey: ["tags", searchQuery],
    staleTime: Infinity,
    queryFn: async () => {
      if (searchQuery.length) {
        const _data = await searchForTags(searchQuery);
        return _data.tags;
      } else {
        const _data = await getAllTags();
        return _data.tags;
      }
    },
  });

  const options =
    data?.map((tag) => ({
      label: (
        <Badge
          key={tag.id}
          className="text-xs text-nowrap"
          variant={tag.variant as any ?? "default"}
        >
          {tag?.name}
        </Badge>
      ),
      value: tag.id,
    })) ?? [];

  const fullOptions = [
    ...selectedOptions,
    ...options.filter(
      (o) => !selectedOptions.find((option) => o.value == option.value)
    ),
  ];

  return (
    <Command shouldFilter={false}>
      <CommandInput
        autoFocus
        value={searchQuery}
        onValueChange={(ev) => setSearchQuery(ev)}
        placeholder={title}
        ref={ref}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {fullOptions.map((option) => {
            const isSelected = selectedValues.has(option.value);
            return (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  if (isSelected) {
                    selectedValues.delete(option.value);
                    setSelectedOptions(
                      selectedOptions.filter((o) => o.value != option.value)
                    );
                  } else {
                    selectedValues.add(option.value);
                    setSelectedOptions([...selectedOptions, option]);
                  }
                  const filterValues = Array.from(selectedValues);
                  column?.setFilterValue(
                    filterValues.length ? filterValues : undefined
                  );
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}
                >
                  <CheckIcon className={cn("h-4 w-4")} />
                </div>

                <span>{option.label}</span>
                {facets?.get(option.value) && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                    {facets.get(option.value)}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {selectedValues.size > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  column?.setFilterValue(undefined);
                  setSelectedOptions([]);
                }}
                className="justify-center text-center"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
});

TagFilter.displayName = "TagFilter";

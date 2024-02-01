import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./command";
import { Badge } from "./badge";
import { Button } from "./button";
import { Avatar, AvatarImage } from "./avatar";

export type Option = {
  label: React.ReactNode;
  value: string;
  avatar?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  onSearchQuery: (query: string) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  onSearchQuery,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const seenItems = {};
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const [selectedOptions, setSelectedOptions] = React.useState<Option[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    onSearchQuery(searchQuery);
  }, [searchQuery]);

  const fullOptions = [
    ...selectedOptions,
    ...options.filter(
      (o) => !selectedOptions.find((option) => o.value == option.value)
    ),
  ];

  React.useEffect(() => {
    let newSelectedOptions: Option[] = [];
    options.forEach((option) => {
      if (
        selectedValues.has(option.value) &&
        !selectedOptions.find((o) => o.value == option.value)
      ) {
        newSelectedOptions.push(option);
      }
    });
    if (newSelectedOptions.length > 0) {
      setSelectedOptions([...selectedOptions, ...newSelectedOptions]);
    }
  }, [options, selectedValues, selectedOptions]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed data-[state=open]:bg-accent"
        >
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={searchQuery}
            onValueChange={(ev) => setSearchQuery(ev)}
            placeholder={title}
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
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    {option.avatar && (
                      <Avatar className="mr-2 h-4 w-4">
                        <AvatarImage src={option.avatar} />
                      </Avatar>
                    )}
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
      </PopoverContent>
    </Popover>
  );
}

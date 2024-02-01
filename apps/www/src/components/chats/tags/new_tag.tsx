"use client";

import * as React from "react";
import { Check, CheckIcon, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { NewTagDialog } from "./new_tag_dialog";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { IChatTagsResponse } from "@/lib/types/tags";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { ITagsProps } from "./shared_types";
import { Skeleton } from "@/components/ui/skeleton";

type ITag = {
  value: string;
  label: string;
  selected: boolean;
  linkId?: string;
};

export function NewTag(props: ITagsProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Badge
          variant="outline"
          className="cursor-pointer whitespace-nowrap"
          role="combobox"
          aria-expanded={open}
        >
          Edit Tags
        </Badge>
        {/* <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          Edit Tags
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button> */}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Suspense
          fallback={
            <div className="w-full p-2">
              <Skeleton className=" h-8" />{" "}
            </div>
          }
        >
          <NewTagCommand {...props} />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}

export const NewTagCommand = ({
  entityName,
  entityId,
  getLinkedTags,
  getAllTags,
  linkTag,
  unlinkTag,
  createAndLinkTag,
}: ITagsProps) => {
  const [searchValue, setSearchValue] = React.useState("");
  const queryKey = [`${entityName}-tags`, entityId];
  const { data: selectedTags } = useSuspenseQuery({
    queryKey,
    queryFn: () => getLinkedTags(entityId),
    staleTime: Infinity,
  });

  const { data: allTags } = useSuspenseQuery({
    queryKey: ["tags"],
    queryFn: () => getAllTags(),
    staleTime: Infinity,
  });

  const queryClient = useQueryClient();

  const tagMutation = useMutation({
    mutationFn: (tag: ITag) => {
      if (tag.selected) return linkTag(tag.value, entityId);
      else return unlinkTag(tag.value, entityId);
    },
    onMutate: async (tag: ITag) => {
      await queryClient.cancelQueries({ queryKey });
      let previousData = queryClient.getQueryData<IChatTagsResponse>(queryKey);
      if (!previousData) previousData = { tags: [] };

      if (tag.selected)
        queryClient.setQueryData(queryKey, {
          tags: [...previousData.tags, { tag }],
        });
      else
        queryClient.setQueryData(queryKey, {
          tags: previousData.tags.filter((_tag) => _tag?.tag?.id !== tag.value),
        });

      return { previousData, tag };
    },
    onError: (err, newTag, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: (newTag) => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const tags = allTags.tags.map((tag) => ({
    value: tag.id,
    label: tag.name ?? "",
    selected: selectedTags.tags.some(
      (selectedTag) => selectedTag?.tag?.id === tag.id
    ),
  }));

  const sortedTags = useMemo(() => {
    return tags.sort((a, b) =>
      a.selected && b.selected
        ? a.label > b.label
          ? 1
          : -1
        : a.selected
          ? -1
          : 1
    );
  }, [tags]);

  const filteredTags = useMemo(() => {
    return searchValue
      ? sortedTags.filter((tag) =>
          tag.label.toLowerCase().includes(searchValue.toLowerCase())
        )
      : sortedTags;
  }, [searchValue, sortedTags]);

  return (
    <>
      <div className=" max-h-80 overflow-scroll">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search tag..."
            onValueChange={(ev) => {
              setSearchValue(ev);
            }}
          />
          {/* <CommandEmpty>
            <CommandItem key="new" value="new" onSelect={() => null}>
              test.
            </CommandItem>
          </CommandEmpty> */}
          <CommandGroup>
            {filteredTags.map((tag) => (
              <CommandItem
                key={tag.value}
                value={tag.value}
                onSelect={async (currentValue) => {
                  const tag = tags.find((tag) => tag.value === currentValue);
                  if (!tag) return;

                  tag.selected = !tag.selected;

                  tagMutation.mutate(tag);
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    tag.selected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}
                >
                  <CheckIcon className={cn("h-4 w-4")} />
                </div>
                <span>{tag.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </div>

      {!!filteredTags.length && <Separator />}
      <div className="  relative  justify-center flex cursor-default select-none items-center rounded-sm  py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
        <NewTagDialog
          initialValue={searchValue}
          entityId={entityId}
          entityName={entityName}
          createAndLinkTag={createAndLinkTag}
        >
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" /> New Tag
          </Button>
        </NewTagDialog>
      </div>
    </>
  );
};

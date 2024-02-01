"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Separator } from "@radix-ui/react-separator";
import { Column, Table } from "@tanstack/react-table";
import {
  RefCallback,
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { TagFilter } from "./tag_filter";

interface TagsFilterProps<TData, TValue> {
  table: Table<TData>;
}
export const TagsFilter = <TData, TValue>({
  table,
}: TagsFilterProps<TData, TValue>) => {
  const [filterCount, setFilterCount] = useState({
    messages: 0,
    users: 0,
    chats: 0,
  });
  const [value, setValue] = useState("message");
  const messagesColumn = table.getColumn("messageTags");
  const usersColumn = table.getColumn("userTags");
  const chatsColumn = table.getColumn("chatTags");

  const messagesFilter = messagesColumn?.getFilterValue() as any[];
  const usersFilter = usersColumn?.getFilterValue() as any[];
  const chatsFilter = chatsColumn?.getFilterValue() as any[];

  console.log(messagesFilter, usersFilter, chatsFilter);
  useEffect(() => {
    setFilterCount({
      messages: messagesFilter?.length ?? 0,
      users: usersFilter?.length ?? 0,
      chats: chatsFilter?.length ?? 0,
    });
  }, [messagesFilter, usersFilter, chatsFilter]);

  const messagesInputRef: RefCallback<HTMLInputElement> = useCallback(
    (node) => {
      if (node !== null) {
        setTimeout(() => {
          if (value == "message") node.focus();
        }, 200);
      }
    },
    [value]
  );

  const usersInputRef: RefCallback<HTMLInputElement> = useCallback(
    (node) => {
      if (node !== null) {
        setTimeout(() => {
          if (value == "user") node.focus();
        }, 200);
      }
    },
    [value]
  );

  const chatsInputRef: RefCallback<HTMLInputElement> = useCallback(
    (node) => {
      if (node !== null) {
        setTimeout(() => {
          if (value == "chat") node.focus();
        }, 200);
      }
    },
    [value]
  );

  const totalFiltered =
    filterCount.messages + filterCount.chats + filterCount.users;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed data-[state=open]:bg-accent"
        >
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          Tags
          {totalFiltered > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {totalFiltered}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {totalFiltered} selected
                </Badge>
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Tabs
          value={value}
          onValueChange={(ev) => setValue(ev)}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-3 -mb-2">
            <TabsTrigger value="message">Message Tag</TabsTrigger>
            <TabsTrigger value="user">User Tag</TabsTrigger>
            <TabsTrigger value="chat">Chat Tag</TabsTrigger>
          </TabsList>
          <TabsContent value="message">
            <TagFilter
              ref={messagesInputRef}
              column={messagesColumn}
              title="Message Tags"
            />
          </TabsContent>
          <TabsContent value="user">
            <TagFilter
              ref={usersInputRef}
              column={usersColumn}
              title="User Tags"
            />
          </TabsContent>
          <TabsContent value="chat">
            <TagFilter
              ref={chatsInputRef}
              column={chatsColumn}
              title="Chat Tags"
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

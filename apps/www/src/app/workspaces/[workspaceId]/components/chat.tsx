"use client";
import { ChatTimestamp } from "@/components/chats/chat/chat_timestamp";
import { NewTagCommand } from "@/components/chats/tags/new_tag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createAndLinkChatTag,
  createAndLinkUserTag,
  getAllTags,
  getLinkedChatTags,
  getLinkedUserTags,
  linkChatTag,
  linkUserTag,
  unlinkChatTag,
  unlinkUserTag,
} from "@/lib/client/api";
import { MoreHorizontal, Tags } from "lucide-react";
import { db } from "@telegram/db";
import { Suspense } from "react";

type ChatType = Awaited<ReturnType<typeof db.query.chats.findMany>>[number];

export const Chat = ({ chat }: { chat: ChatType }) => {
  return (
    <div className="flex flex-col w-full shadow rounded-lg p-2 overflow-hidden gap-2 dark:border border-gray-500">
      <div className="flex items-center justify-between">
        <div className="flex w-full gap-4 items-center overflow-hidden ">
          <Avatar className="border w-10 h-10">
            <AvatarImage alt="Image" src={chat.pfpUrl ?? undefined} />
            <AvatarFallback>
              {chat.title
                ?.match(/\b(\w)/g)
                ?.slice(0, 3)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            <p className="text-sm font-medium leading-none whitespace-nowrap overflow-ellipsis">
              {!!chat.title?.length ? (
                chat.title
              ) : (
                <span className="text-gray-500 italic text-xs">No Name</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400  whitespace-nowrap">
              <ChatTimestamp date={chat.lastMessageDate} />
            </p>
          </div>
        </div>
        <div className="flex items-center ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Remove from Workspace</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="mr-2 h-4 w-4" />
                  Edit Tags
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <Suspense fallback={<div>Loading...</div>}>
                    <NewTagCommand
                      entityName="chats"
                      entityId={chat.id}
                      getLinkedTags={getLinkedChatTags}
                      getAllTags={getAllTags}
                      linkTag={linkChatTag}
                      unlinkTag={unlinkChatTag}
                      createAndLinkTag={createAndLinkChatTag}
                    />
                  </Suspense>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea orientation="horizontal">
        <div className="text-xs text-gray-500 p-2 pt-0 flex gap-2 flex-nowrap w-full whitespace-nowrap h-full">
          Internal ID: <pre>{chat.id}</pre>
          Telegram ID: <pre>{chat.telegramId}</pre>
        </div>
      </ScrollArea>
    </div>
  );
};

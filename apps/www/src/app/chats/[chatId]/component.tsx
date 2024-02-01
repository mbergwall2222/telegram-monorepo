"use client";
import { Input } from "@/components/ui/input";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatList } from "@/components/chats/chat_sidebar/chat_list";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/chats/chat_sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getCookies } from "next-client-cookies/server";
import { getLayoutSizes } from "@/lib/utils";
import { ChatMessages } from "@/components/chats/chat_messages";
import { useDebounce } from "@uidotdev/usehooks";

export const Component = ({ chat }: { chat: IChat }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  return (
    <>
      <ResizableHandle withHandle />

      <ResizablePanel id="chat" defaultSize={70} order={1} minSize={20}>
        <div className="flex flex-grow flex-col ">
          <div className="p-3 flex justify-between border-b items-center gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Avatar className="border w-10 h-10">
                {chat?.pfpUrl && <AvatarImage alt="Image" src={chat?.pfpUrl} />}
                <AvatarFallback>
                  {chat?.title
                    ?.match(/\b(\w)/g)
                    ?.slice(0, 3)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <p className="text-sm font-medium leading-none">
                  {chat?.title}
                </p>
              </div>
            </div>
            <Input
              className="h-8 max-w-96"
              placeholder="Search for messages..."
              onChange={(ev) => setSearchQuery(ev.target.value)}
            />
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <ChatMessages chatId={chat.id} query={debouncedSearchQuery} />
          </Suspense>
        </div>
      </ResizablePanel>
    </>
  );
};

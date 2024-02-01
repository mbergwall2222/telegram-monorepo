"use client";
import { ChatList } from "./chat_list";
import { Input } from "@/components/ui/input";
import { cn, getLayoutSizes } from "@/lib/utils";
import { ISidebarProps } from "./types";
import { MotionDiv } from "@/components/ui/use-motion";
import { getTags } from "@/lib/server/api";
import { Suspense, useEffect, useRef, useState } from "react";
import { ResizablePanel } from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowBigRightDash } from "lucide-react";
import { ImperativePanelHandle } from "react-resizable-panels";
import { useDebounce, usePrevious } from "@uidotdev/usehooks";
import { useCookies } from "next-client-cookies";

export const Sidebar = () => {
  const { chatId } = useParams();
  const ref = useRef<ImperativePanelHandle>(null);
  const cookies = useCookies();
  const prevChatId = usePrevious(chatId);

  const savedLayout = getLayoutSizes(cookies);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  return (
    <ResizablePanel
      id="sidebar"
      defaultSize={chatId ? 30 : 100}
      order={0}
      ref={ref}
      minSize={10}
    >
      <div
        className={cn(
          "bg-gray-100/20 p-3 border-r dark:bg-gray-800/20 flex h-screen flex-col flex-none w-full"
          // fullWidth ? "w-full" : "w-96 flex-none"
        )}
      >
        <div className="flex items-center justify-between space-x-4 h-12">
          <div className="font-medium text-sm">
            X21 - Chat List{" "}
            <span className="font-normal">
              (click on a chat to view messages)
            </span>
          </div>
          <Link href="/chats">
            <Button size="icon">
              <ArrowBigRightDash />
            </Button>
          </Link>
        </div>

        <div className="py-4">
          <form>
            <Input
              className="h-8"
              placeholder="Search"
              onChange={(ev) => setSearchQuery(ev.target.value)}
            />
          </form>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <ChatList searchQuery={debouncedSearchQuery} />
        </Suspense>
      </div>
    </ResizablePanel>
  );
};

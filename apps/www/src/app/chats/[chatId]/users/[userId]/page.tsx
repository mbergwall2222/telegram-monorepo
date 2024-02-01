import { Input } from "@/components/ui/input";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatList } from "@/components/chats/chat_sidebar/chat_list";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDash, ArrowBigRightDash, ArrowRight } from "lucide-react";
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
import { chats, db, eq, users } from "@telegram/db";
// export const dynamic = "force-dynamic";


type IParams = {
  chatId: string;
  userId: string;
};

const combineNames = (...names: any[]) => {
  return names.filter(Boolean).join(" ");
};

export default async function ChatMessagesPage({
  params: { chatId, userId },
}: {
  params: IParams;
}) {
  const chat = await db.query.chats.findFirst({where: eq(chats.id, chatId)});
  const user = await db.query.users.findFirst({where: eq(users.id, userId)});
  const cookies = getCookies();

  const savedLayout = getLayoutSizes(cookies);

  return (
    <>
      <ResizableHandle withHandle />

      <ResizablePanel id="chat" defaultSize={70} order={1} minSize={20}>
        <div className="flex flex-grow flex-col ">
          <div className="p-3 flex border-b items-center justify-evenly gap-4">
            <div className="flex items-center gap-4 justify-evenly whitespace-nowrap text-nowrap">
              <Link
                href={`/chats/${chatId}`}
                className="flex items-center gap-2"
              >
                <Avatar className="border w-10 h-10">
                  {chat?.pfpUrl && (
                    <AvatarImage alt="Image" src={chat?.pfpUrl} />
                  )}
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
              </Link>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <Avatar className="border w-10 h-10">
                  {user?.pfpUrl && (
                    <AvatarImage alt="Image" src={user?.pfpUrl} />
                  )}
                  <AvatarFallback>
                    {user?.firstName
                      ?.match(/\b(\w)/g)
                      ?.slice(0, 3)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                  <p className="text-sm font-medium leading-none">
                    {combineNames(
                      user?.firstName,
                      user?.lastName,
                      user?.username ? `(@${user?.username})` : null
                    )}
                  </p>
                </div>
              </div>
            </div>
            <Input
              className="h-8 max-w-1/2"
              placeholder="Search"
              // onChange={(ev) => setSearchQuery(ev.target.value)}
            />
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <ChatMessages chatId={chatId} userId={userId} />
          </Suspense>
        </div>
      </ResizablePanel>
    </>
  );
}

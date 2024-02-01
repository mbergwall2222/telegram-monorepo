import { Input } from "@/components/ui/input";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatList } from "@/components/chats/chat_sidebar/chat_list";
import { Suspense } from "react";
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
import { Component } from "./component";
import { chats, db, eq } from "@telegram/db";
import { unstable_cache } from "next/cache";
// export const dynamic = "force-dynamic";

type IParams = {
  chatId: string;
};

export default async function ChatMessagesPage({
  params: { chatId },
}: {
  params: IParams;
}) {
  const getChat = unstable_cache(
    (id: string) => db.query.chats.findFirst({ where: eq(chats.id, id) }),
    ["chat"],
    { tags: [`chat|${chatId}`] }
  );

  const chat = await getChat(chatId);
  const cookies = getCookies();
  // const [searchQuery, setSearchQuery] = useState("");

  const savedLayout = getLayoutSizes(cookies);

  return chat && <Component chat={chat as any} />;
}

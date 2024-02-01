import { Input } from "@/components/ui/input";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatList } from "@/components/chats/chat_sidebar/chat_list";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/chats/chat_sidebar";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

export const dynamic = "force-dynamic";

export default async function ChatMessagesLoading({}) {
  return (
    <>
      <ResizableHandle withHandle />

      <ResizablePanel id="chat" defaultSize={70} order={1}></ResizablePanel>
    </>
  );
}

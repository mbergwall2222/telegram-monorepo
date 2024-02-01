import { Input } from "@/components/ui/input";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatList } from "@/components/chats/chat_sidebar/chat_list";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/chats/chat_sidebar/sidebar";

export default async function Home() {
  // const _chats = await xata.db.chats.getMany({
  //   pagination: { size: 20 },
  //   sort: { lastMessageDate: "desc" },
  // });

  // const chats = _chats.map((chat) => chat.toSerializable() as IChat);

  return null;
}

// export const dynamic = "force-dynamic";

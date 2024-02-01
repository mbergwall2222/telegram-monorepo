import { Sidebar } from "@/components/chats/chat_sidebar";
import { Button } from "@/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ArrowBigRightDash } from "lucide-react";
import Link from "next/link";
import { ResizeGroup } from "@/components/chats/resize_group";
import { getCookies } from "next-client-cookies/server";

export default function ChatsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const cookies = getCookies();

  const layout = cookies.get("layout");

  let defaultLayout;
  if (layout) {
    defaultLayout = JSON.parse(layout);
  }
  return (
    <main className="flex h-screen">
      <ResizeGroup defaultLayout={defaultLayout}>
        <Sidebar />
        {children}
      </ResizeGroup>
    </main>
  );
}

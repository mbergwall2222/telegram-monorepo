import { getChat } from "@/lib/server/api";
import { IGetChatResponse } from "@/lib/types/chats";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params: { chatId } }: { params: { chatId: string } }
) {
  const chat = await getChat(chatId);

  if (!chat)
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  return NextResponse.json({
    chat: chat,
  } as IGetChatResponse);
}

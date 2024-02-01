import { searchForChatMessages, searchForChats } from "@/lib/server/api";
import { IChatsSearchResponse } from "@/lib/types/chats";
import { IGetChatMessagesResponse } from "@/lib/types/messages";
import { db, inArray, messages } from "@telegram/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params: { chatId } }: { params: { chatId: string } }
) {
  const body = (await request.json()) as { query: string };
  const messagesData = await searchForChatMessages(chatId, body.query);

  if (messagesData.length == 0)
    return NextResponse.json({
      messages: [],
      page: {
        next: -1,
      },
    } as IGetChatMessagesResponse);

  const messagesFull = await db.query.messages.findMany({
    where: inArray(messages.id, messagesData.map((o) => o!.id)),
    with: { user: true, chat: true, document: true },
  });

  return NextResponse.json({
    messages: messagesFull,
    page: { next: -1 },
  } as IGetChatMessagesResponse);
}

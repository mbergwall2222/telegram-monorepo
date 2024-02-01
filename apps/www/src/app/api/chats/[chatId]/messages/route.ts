import { getChatMessages } from "@/lib/server/api";
import { IGetChatMessagesResponse } from "@/lib/types/messages";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params: { chatId } }: { params: { chatId: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const cursorString = searchParams.get("cursor");
  const cursor = cursorString ? parseInt(cursorString) : 0;
  const filterByUserId = searchParams.get("userId");
  const messages = await getChatMessages(chatId, cursor, filterByUserId);

  return NextResponse.json({
    messages,
    page: {
      next: cursor + 10,
    },
  } as IGetChatMessagesResponse);
}

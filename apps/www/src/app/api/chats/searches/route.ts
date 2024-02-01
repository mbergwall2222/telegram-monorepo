import { searchForChats } from "@/lib/server/api";
import { IChatsSearchResponse, IGetChatsResponse } from "@/lib/types/chats";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { query: string };
  const res = await searchForChats(body.query);
  return NextResponse.json({
    page: { next: -1 },
    chats: res.hits.hits
      .filter((o) => o._source)
      .map((o) => ({
        id: o._source!.id as string,
        title: o._source!.title,
        telegramId: o._source?.telegram_id,
        isGroup: o._source!.is_group,
        isChannel: o._source!.is_channel,
        memberCount: o._source?.member_count,
        pfpUrl: o._source?.pfp_url,
        lastMessageDate: new Date(o._source!.last_message_date),
      })),
  } as IGetChatsResponse);
}

import { getChats } from "@/lib/server/api";
import { IGetChatsResponse } from "@/lib/types/chats";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursorStr = searchParams.get("cursor");
  const cursor = cursorStr ? parseInt(cursorStr) : 0;
  const chats = await getChats(cursor);

  // chats.m
  return NextResponse.json({ chats, page: {next: cursor + 20 } } satisfies IGetChatsResponse);
}

// export const revalidate = 10;

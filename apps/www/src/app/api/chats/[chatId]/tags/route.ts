import { getChatTags, linkChatTag, linkUserTag } from "@/lib/server/api";
import { IChatTagsResponse, ILinkTagResponse } from "@/lib/types/tags";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params: { chatId } }: { params: { chatId: string } }
) {
  const tags = await getChatTags(chatId);

  return NextResponse.json({
    tags: tags,
  } as IChatTagsResponse);
}

export async function POST(
  request: Request,
  { params: { chatId } }: { params: { chatId: string } }
) {
  const body = (await request.json()) as { id: string };
  const res = await linkChatTag(body.id, chatId);
  return NextResponse.json({
    success: true,
    linkedTag: res[0],
  } as ILinkTagResponse);
}

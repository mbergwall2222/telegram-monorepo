import {
  getChatTags,
  getMessageTags,
  getUserTags,
  linkMessageTag,
  linkUserTag,
} from "@/lib/server/api";
import {
  IChatTagsResponse,
  ILinkTagMessageResponse,
  ILinkTagResponse,
} from "@/lib/types/tags";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params: { messageId } }: { params: { messageId: string } }
) {
  const tags = await getMessageTags(messageId);

  if (!tags) return NextResponse.json({ tags: [] });

  return NextResponse.json({
    tags: tags.map((t) => ({ tag: t })),
  } as IChatTagsResponse);
}

export async function POST(
  request: Request,
  { params: { messageId } }: { params: { messageId: string } }
) {
  const body = (await request.json()) as { id: string };
  const res = await linkMessageTag(body.id, messageId);
  return NextResponse.json({
    success: true,
    linkedTag: res[0],
  } as ILinkTagMessageResponse);
}

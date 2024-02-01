import { getChatTags, getUserTags, linkUserTag } from "@/lib/server/api";
import {
  IChatTagsResponse,
  ILinkTagResponse,
  ILinkTagUserResponse,
} from "@/lib/types/tags";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params: { userId } }: { params: { userId: string } }
) {
  const tags = await getUserTags(userId);

  return NextResponse.json({
    tags: tags.map((t) => ({ tag: t })),
  } as IChatTagsResponse);
}

export async function POST(
  request: Request,
  { params: { userId } }: { params: { userId: string } }
) {
  const body = (await request.json()) as { id: string };
  const res = await linkUserTag(body.id, userId);
  return NextResponse.json({
    success: true,
    linkedTag: res[0],
  } as ILinkTagUserResponse);
}

import { searchForTags } from "@/lib/server/api";
import { IChatAllTagsResponse } from "@/lib/types/tags";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { query: string };
  const tags = await searchForTags(body.query);

  return NextResponse.json({
    tags,
  } as IChatAllTagsResponse);
}

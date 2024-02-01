import { createTag, getAllTags } from "@/lib/server/api";
import { IChatAllTagsResponse, ICreateTagResponse } from "@/lib/types/tags";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const tags = await getAllTags();

  return NextResponse.json({ tags } satisfies IChatAllTagsResponse);
}

export async function POST(request: Request) {
  const user = auth();

  if(!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = (await request.json()) as {
    name: string;
    description?: string;
  };
  const res = await createTag({ name, description, orgId: user.orgId ?? user.userId as string });
  return NextResponse.json({
    success: true,
    tag: res[0]
  } as ICreateTagResponse);
}

// export const revalidate = 10;

import { unlinkUserTags } from "@/lib/server/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params: { userId, tagId } }: { params: { userId: string; tagId: string } }
) {
  const data = await unlinkUserTags(tagId, userId);
  return NextResponse.json({
    success: true,
  });
}

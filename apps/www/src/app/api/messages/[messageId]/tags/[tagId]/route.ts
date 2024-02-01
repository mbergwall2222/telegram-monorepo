import { unlinkMessageTags, unlinkUserTags } from "@/lib/server/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  {
    params: { messageId, tagId },
  }: { params: { messageId: string; tagId: string } }
) {
  const data = await unlinkMessageTags(tagId, messageId);
  return NextResponse.json({
    success: true,
  });
}

import { unlinkChatTags } from "@/lib/server/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params: { chatId, tagId } }: { params: { chatId: string; tagId: string } }
) {
  const data = await unlinkChatTags(tagId, chatId);
  return NextResponse.json({
    success: true,
  });
}

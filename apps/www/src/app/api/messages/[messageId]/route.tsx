import { getMessage } from "@/lib/server/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params: { messageId } }: { params: { messageId: string } }
) {
  const message = await getMessage(messageId);

  return NextResponse.json(message);
}

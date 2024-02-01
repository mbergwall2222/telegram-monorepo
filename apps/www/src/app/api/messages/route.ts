import { getChatMessages, getMessages } from "@/lib/server/api";
import {
  IGetChatMessagesResponse,
  IGetMessagesResponse,
} from "@/lib/types/messages";
import {
  GetMessagesParams,
  getMessagesSearchParamsSchema,
} from "@/schemas/getMessages";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validation = getMessagesSearchParamsSchema.safeParse(searchParams);
  if (!validation.success) return NextResponse.json(validation.error);

  const params: GetMessagesParams = validation.data;

  const messages = await getMessages(params);
  return NextResponse.json(messages satisfies IGetMessagesResponse);
  // const { messages, summarization } = await getMessages(params);

  // return Response.json({
  //   messages: {
  //     meta: {
  //       ...messages.meta,
  //       totalRecords: summarization.summaries[0].total,
  //     },
  //     records: messages.records.toSerializable(),
  //   },
  // } as IGetChatMessagesResponse);
}

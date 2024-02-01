import { searchForChats, searchForMessages } from "@/lib/server/api";
import { IChatsSearchResponse } from "@/lib/types/chats";
import { IGetChatMessagesResponse } from "@/lib/types/messages";
import { auth, clerkClient } from "@clerk/nextjs";
import { and, db, savedFilters, eq, inArray, messages } from "@telegram/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const authUser = auth();

  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const savedFiltersData = await db.query.savedFilters.findMany({
    where: and(
      eq(savedFilters.orgId, authUser.orgId ?? (authUser.userId as string)),
      eq(savedFilters.type, "message")
    ),
  });

  const users = await clerkClient.users.getUserList({
    userId: savedFiltersData.map((o) => o.userId as string),
  });

  return NextResponse.json(
    savedFiltersData.map((o) => {
      const user = users.find((u) => u.id === o.userId);
      return {
        ...o,
        user: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          imageUrl: user?.imageUrl,
        },
      };
    })
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as { query: string };
  const messagesData = await searchForMessages(body.query);

  if (messagesData.length == 0)
    return NextResponse.json({
      messages: [],
      page: {
        next: -1,
      },
    } as IGetChatMessagesResponse);

  const messagesFull = await db.query.messages.findMany({
    where: inArray(
      messages.id,
      messagesData.map((o) => o!.id)
    ),
    with: { user: true, chat: true, document: true },
  });

  messagesFull[0];

  return NextResponse.json({
    messages: messagesFull,
    page: { next: -1 },
  } as IGetChatMessagesResponse);
}

const newSearchSchema = z.object({
  name: z.string().min(2),
  query: z.string(),
});

export async function PUT(request: Request) {
  const userAuth = auth();

  if (!userAuth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = newSearchSchema.safeParse(await request.json());

  if (!body.success)
    return NextResponse.json({ error: body.error }, { status: 400 });

  const newSavedSearch = await db
    .insert(savedFilters)
    .values({
      name: body.data.name,
      params: body.data.query,
      type: "message",
      userId: userAuth.userId as string,
      orgId: userAuth.orgId ?? (userAuth.userId as string),
    })
    .returning();

  return NextResponse.json(newSavedSearch[0]);
}

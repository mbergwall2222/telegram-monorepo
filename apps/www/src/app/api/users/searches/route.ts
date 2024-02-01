import {
  searchForChats,
  searchForMessages,
  searchForUsers,
} from "@/lib/server/api";
import { IChatsSearchResponse } from "@/lib/types/chats";
import { IGetUsersResponse, IUser } from "@/lib/types/users";
import { replaceNullStrings } from "@/lib/utils";
import { z } from "zod";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { and, db, savedFilters, eq } from "@telegram/db";

export async function GET() {
  const authUser = auth();

  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const savedFiltersData = await db.query.savedFilters.findMany({
    where: and(
      eq(savedFilters.orgId, authUser.orgId ?? (authUser.userId as string)),
      eq(savedFilters.type, "user")
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
  const usersData = await searchForUsers(body.query);

  const users = replaceNullStrings(
    usersData.map((user) => ({
      id: user!.id,
      firstName: user!.first_name,
      lastName: user!.last_name,
      username: user!.username,
      pfpUrl: user!.pfp_url,
    }))
  );

  return NextResponse.json({
    users,
  } satisfies IGetUsersResponse);
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
      type: "user",
      userId: userAuth.userId as string,
      orgId: userAuth.orgId ?? (userAuth.userId as string),
    })
    .returning();

  return NextResponse.json(newSavedSearch[0]);
}

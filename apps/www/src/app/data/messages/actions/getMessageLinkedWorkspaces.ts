"use server";

import { auth } from "@clerk/nextjs";
import {
  db,
  and,
  eq,
  exists,
  workspaces,
  workspacesToMessages,
} from "@telegram/db";

export const getMessageLinkedWorkspaces = async (id: string) => {
  const user = auth();

  if (!user)
    return {
      success: false as const,
      error: "You must be logged in to view your workspaces.",
    };

  const workspacesData = await db
    .select()
    .from(workspacesToMessages)
    .innerJoin(workspaces, eq(workspaces.id, workspacesToMessages.workspaceId))
    .where(
      and(
        eq(workspacesToMessages.messageId, id),
        eq(workspaces.orgId, user.orgId ?? (user.userId as string))
      )
    );

  return {
    success: true as const,
    data: workspacesData.map((o) => o.workspaces),
  };
};

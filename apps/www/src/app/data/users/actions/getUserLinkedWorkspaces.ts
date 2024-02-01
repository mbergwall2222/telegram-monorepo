"use server";

import { auth } from "@clerk/nextjs";
import {
  db,
  and,
  eq,
  exists,
  workspaces,
  workspacesToUsers,
} from "@telegram/db";

export const getUserLinkedWorkspaces = async (id: string) => {
  const user = auth();

  if (!user)
    return {
      success: false as const,
      error: "You must be logged in to view your workspaces.",
    };

  const workspacesData = await db
    .select()
    .from(workspacesToUsers)
    .innerJoin(workspaces, eq(workspaces.id, workspacesToUsers.workspaceId))
    .where(
      and(
        eq(workspacesToUsers.userId, id),
        eq(workspaces.orgId, user.orgId ?? (user.userId as string))
      )
    );

  return {
    success: true as const,
    data: workspacesData.map((o) => o.workspaces),
  };
};

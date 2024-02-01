"use server";

import { auth } from "@clerk/nextjs";
import {
  and,
  db,
  eq,
  users,
  sql,
  workspaces,
  workspacesToUsers,
} from "@telegram/db";

export const unlinkUserToWorkspace = async ({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) => {
  const userAuth = auth();

  if (!userAuth)
    return {
      success: false as const,
      error: "You must be logged in to view your workspaces.",
    };

  const workspace = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.id, workspaceId),
      eq(workspaces.orgId, userAuth.orgId ?? (userAuth.userId as string))
    ),
  });

  if (!workspace)
    return { success: false as const, error: "Workspace not found." };

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return { success: false as const, error: "User not found." };

  const link = await db
    .delete(workspacesToUsers)
    .where(
      and(
        eq(workspacesToUsers.workspaceId, workspaceId),
        eq(workspacesToUsers.userId, userId)
      )
    );

  await db
    .update(users)
    .set({
      workspaceIds: sql`array_remove(${users.workspaceIds}, ${workspaceId})`,
    })
    .where(eq(users.id, userId));

  return { success: true as const };
};

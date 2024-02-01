"use server";

import { auth } from "@clerk/nextjs";
import { db, eq, workspaces } from "@telegram/db";

export const getWorkspaces = async () => {
  const user = auth();

  if (!user)
    return {
      success: false as const,
      error: "You must be logged in to view your workspaces.",
    };

  const workspacesData = await db.query.workspaces.findMany({
    where: eq(workspaces.orgId, user.orgId ?? (user.userId as string)),
  });

  return { success: true as const, data: workspacesData };
};

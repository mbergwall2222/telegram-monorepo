"use server";

import { auth } from "@clerk/nextjs";
import {
  and,
  db,
  eq,
  messages,
  sql,
  workspaces,
  workspacesToMessages,
} from "@telegram/db";

export const unlinkMessageToWorkspace = async ({
  workspaceId,
  messageId,
}: {
  workspaceId: string;
  messageId: string;
}) => {
  const user = auth();

  if (!user)
    return {
      success: false as const,
      error: "You must be logged in to view your workspaces.",
    };

  const workspace = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.id, workspaceId),
      eq(workspaces.orgId, user.orgId ?? (user.userId as string))
    ),
  });

  if (!workspace)
    return { success: false as const, error: "Workspace not found." };

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!message) return { success: false as const, error: "Message not found." };

  const link = await db
    .delete(workspacesToMessages)
    .where(
      and(
        eq(workspacesToMessages.workspaceId, workspaceId),
        eq(workspacesToMessages.messageId, messageId)
      )
    );

  await db
    .update(messages)
    .set({
      workspaceIds: sql`array_remove(${messages.workspaceIds}, ${workspaceId})`,
    })
    .where(eq(messages.id, messageId));

  return { success: true as const };
};

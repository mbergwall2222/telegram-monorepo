import { ChatTimestamp } from "@/components/chats/chat/chat_timestamp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { auth, clerkClient } from "@clerk/nextjs";
import {
  and,
  db,
  eq,
  isNotNull,
  like,
  messages,
  not,
  workspaces,
} from "@telegram/db";
import { formatRelative } from "date-fns";
import { FileText, ImageIcon, Sticker, Video } from "lucide-react";
import { WrongOrg } from "./components/wrong-org";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "./components/message";
import { WorkspaceMessages } from "./components/workspace-messages";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "./components/user";
import { WorkspaceUsers } from "./components/workspace-users";
import { WorkspaceChats } from "./components/workspace-chats";
import { WorkspaceInput } from "./components/input";

export default async function Page({
  params: { workspaceId },
  searchParams,
}: {
  params: { workspaceId: string };
  searchParams?: {
    query?: string;
    disableChatsFilter?: string;
    disableUsersFilter?: string;
    disableMessagesFilter?: string;
  };
}) {
  const user = auth();
  if (!user) return <div>You must be logged in to view this workspace.</div>;
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  if (!workspace) return <div>Workspace not found</div>;
  if (workspace.orgId != (user.orgId ?? (user.userId as string))) {
    return <WrongOrg orgId={workspace.orgId} />;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center flex-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl">{workspace.name}</h1>
          <h2 className="text-sm text-gray-700 dark:text-gray-400">
            {workspace?.description}
          </h2>
        </div>
        <div className="flex">
          <WorkspaceInput />
        </div>
      </div>
      <div className="w-full flex-grow min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full rounded-lg border"
        >
          <ResizablePanel>
            <div className="flex h-full flex-col gap-2 p-6">
              <span className="font-semibold">Chats</span>
              <Separator />
              <Suspense
                key={
                  searchParams?.query + `${searchParams?.disableChatsFilter}`
                }
                fallback={
                  <>
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                  </>
                }
              >
                <WorkspaceChats
                  workspaceId={workspaceId}
                  query={
                    !searchParams?.disableChatsFilter
                      ? searchParams?.query
                      : undefined
                  }
                />
              </Suspense>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div className="flex h-full flex-col gap-2 p-6">
              <span className="font-semibold">Users</span>
              <Separator />
              <Suspense
                key={
                  searchParams?.query + `${searchParams?.disableUsersFilter}`
                }
                fallback={
                  <>
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                  </>
                }
              >
                <WorkspaceUsers
                  workspaceId={workspaceId}
                  query={
                    !searchParams?.disableUsersFilter
                      ? searchParams?.query
                      : undefined
                  }
                />
              </Suspense>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          <ResizablePanel>
            <div className="flex h-full flex-col gap-2 p-6">
              <span className="font-semibold">Messages</span>
              <Separator />
              <Suspense
                key={
                  searchParams?.query + `${searchParams?.disableMessagesFilter}`
                }
                fallback={
                  <>
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                    <Skeleton className="w-full h-16" />
                  </>
                }
              >
                <WorkspaceMessages
                  workspaceId={workspaceId}
                  query={
                    !searchParams?.disableMessagesFilter
                      ? searchParams?.query
                      : undefined
                  }
                />
              </Suspense>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="h-8 flex-none"></div>
    </div>
  );
}

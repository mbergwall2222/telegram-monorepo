import { db, eq, workspaces } from "@telegram/db";
import {
  CreateWorkspace,
  ICreateWorkspaceForm,
} from "./components/create-workspace";
import { auth, clerkClient } from "@clerk/nextjs";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const user = auth();

  if (!user) return null;
  const createWorkspace = async (formData: ICreateWorkspaceForm) => {
    "use server";

    const user = auth();

    if (!user)
      return {
        success: false as const,
        error: "You must be logged in to create a workspace.",
      };

    const workspace = await db
      .insert(workspaces)
      .values({
        orgId: user.orgId ?? (user.userId as string),
        userId: user.userId as string,
        name: formData.name,
        description: formData.description,
      })
      .returning();

    return { success: true as const, data: workspace[0] };
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Workspaces</h1>
      <h2 className="text-sm -mt-2 text-gray-700 dark:text-gray-400">
        Workspaces allow you to organize information (chats, messages, users) in
        a specific manner. This can be useful for current investigations or for
        extracting information from the larger datasets for further review.
      </h2>
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-end items-center">
          <CreateWorkspace createWorkspace={createWorkspace} />
        </div>
        <Workspaces orgId={user.orgId ?? (user.userId as string)} />
      </div>
    </div>
  );
}

const combineNames = (...names: any[]) => {
  return names.filter(Boolean).join(" ");
};

const Workspaces = async ({ orgId }: { orgId: string }) => {
  const workspacesData = await db.query.workspaces.findMany({
    where: eq(workspaces.orgId, orgId),
  });

  const users = await clerkClient.users.getUserList({
    userId: workspacesData.map((o) => o.userId as string),
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4">
      {workspacesData.map((workspace) => {
        const user = users.find((o) => o.id === workspace.userId);
        return (
          <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
            <Card className="group cursor-pointer hover:border-gray-400">
              <div className="flex justify-between items-start">
                <CardHeader>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardDescription>{workspace.description}</CardDescription>
                </CardHeader>
                <div className="p-4">
                  <ExternalLink className="h-6 w-6 hidden group-hover:block" />
                </div>
              </div>
              <CardFooter className="flex items-center gap-2 justify-center">
                <Avatar>
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.username ?? "User"}
                  />
                  <AvatarFallback>
                    {combineNames(user?.firstName, user?.lastName)
                      ?.match(/\b(\w)/g)
                      ?.slice(0, 3)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p>
                  {user?.firstName} {user?.lastName}
                </p>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

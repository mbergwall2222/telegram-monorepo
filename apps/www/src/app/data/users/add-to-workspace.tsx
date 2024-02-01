"use client";

import { IMessage } from "@/lib/types/messages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspaces } from "./actions/getWorkspaces";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, Tags } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { IUser } from "@/lib/types/users";
import { linkUserToWorkspace } from "./actions/linkUserToWorkspace";
import { unlinkUserToWorkspace } from "./actions/unlinkUserToWorkspace";
import { getUserLinkedWorkspaces } from "./actions/getUserLinkedWorkspaces";

export const AddToWorkspace = ({ user }: { user: IUser }) => {
  const queryClient = useQueryClient();

  const [searchValue, setSearchValue] = React.useState("");
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => {
      return getWorkspaces();
    },
  });

  const linkWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      linkUserToWorkspace({ workspaceId, userId: user.id }),
    onSettled: (data) => {
      if (!data?.success) {
        toast.error(data?.error ?? "Something went wrong.");
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["linkedWorkspaces", user.id],
      });
      toast.success("User linked to workspace.");
    },
  });

  const unlinkWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      unlinkUserToWorkspace({ workspaceId, userId: user.id }),
    onSettled: (data) => {
      if (!data?.success) {
        toast.error(data?.error ?? "Something went wrong.");
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["linkedWorkspaces", user.id],
      });
      toast.success("User removed workspace.");
    },
  });

  const { data: linkedWorkspaces, isLoading: isLinkedLoading } = useQuery({
    queryKey: ["linkedWorkspaces", user.id],
    queryFn: () => {
      return getUserLinkedWorkspaces(user.id);
    },
  });

  console.log(linkedWorkspaces);

  if (isLoading || !workspaces?.success || !linkedWorkspaces?.success)
    return (
      <DropdownMenuItem>
        <Tags className="mr-2 h-4 w-4" />
        Add to Workspace
      </DropdownMenuItem>
    );

  const filteredWorkspaces = searchValue.length
    ? workspaces.data?.filter((workspace) =>
        workspace.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : workspaces.data;

  const sortedWorkspaces = filteredWorkspaces?.sort((a, b) => {
    if (
      linkedWorkspaces.data?.some(
        (linkedWorkspace) => linkedWorkspace.id === a.id
      )
    )
      return -1;
    else if (
      linkedWorkspaces.data?.some(
        (linkedWorkspace) => linkedWorkspace.id === b.id
      )
    )
      return 1;
    else return 0;
  });

  const isSelected = (id: string) =>
    linkedWorkspaces.data?.some((linkedWorkspace) => linkedWorkspace.id === id);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Tags className="mr-2 h-4 w-4" />
        Add to Workspace
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-0">
        <div className=" max-h-80 overflow-scroll">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search workspaces..."
              onValueChange={(ev) => {
                setSearchValue(ev);
              }}
            />
            {/* <CommandEmpty>
            <CommandItem key="new" value="new" onSelect={() => null}>
              test.
            </CommandItem>
          </CommandEmpty> */}
            <CommandGroup>
              {sortedWorkspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.id}
                  onSelect={async (currentValue) => {
                    const selected = isSelected(currentValue);

                    if (!selected) {
                      linkWorkspaceMutation.mutate(currentValue);
                    } else {
                      unlinkWorkspaceMutation.mutate(currentValue);
                    }
                  }}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected(workspace.id)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <CheckIcon className={cn("h-4 w-4")} />
                  </div>
                  <span>{workspace.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

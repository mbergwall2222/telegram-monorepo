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
import { getMessageLinkedWorkspaces } from "./actions/getMessageLinkedWorkspaces";
import { linkMessageToWorkspace } from "./actions/linkMessageToWorkspace";
import { toast } from "sonner";
import { unlinkMessageToWorkspace } from "./actions/unlinkMessageToWorkspace";

export const AddToWorkspace = ({ message }: { message: IMessage }) => {
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
      linkMessageToWorkspace({ workspaceId, messageId: message.id }),
    onSettled: (data) => {
      if (!data?.success) {
        toast.error(data?.error ?? "Something went wrong.");
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["linkedWorkspaces", message.id],
      });
      toast.success("Message linked to workspace.");
    },
  });

  const unlinkWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      unlinkMessageToWorkspace({ workspaceId, messageId: message.id }),
    onSettled: (data) => {
      if (!data?.success) {
        toast.error(data?.error ?? "Something went wrong.");
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["linkedWorkspaces", message.id],
      });
      toast.success("Message removed workspace.");
    },
  });

  const { data: linkedWorkspaces, isLoading: isLinkedLoading } = useQuery({
    queryKey: ["linkedWorkspaces", message.id],
    queryFn: () => {
      return getMessageLinkedWorkspaces(message.id);
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

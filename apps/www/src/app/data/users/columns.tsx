"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { IMessage } from "@/lib/types/messages";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ColumnDefWithShow } from "@/lib/types/table";
import { Suspense } from "react";
import { Tags } from "@/components/chats/tags/tags";
import {
  getLinkedMessageTags,
  unlinkMessageTag,
  createAndLinkMessageTag,
  getAllTags,
  linkMessageTag,
  getLinkedUserTags,
  linkUserTag,
  unlinkUserTag,
  createAndLinkUserTag,
  getLinkedChatTags,
  linkChatTag,
  unlinkChatTag,
  createAndLinkChatTag,
} from "@/lib/client/api";
import { IEnrichedUser, IUser } from "@/lib/types/users";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { compressFilter } from "@/schemas/parsers/filter";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToWorkspace } from "./add-to-workspace";

export const columns: ColumnDefWithShow<IEnrichedUser, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    title: "",
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    border: false,
  },

  {
    header: "Identifiers",
    columns: [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Telegram ID" />
        ),
        title: "Telegram ID",
        border: "r",
        show: false,
      },
    ],
  },
  {
    header: "User",
    columns: [
      {
        accessorKey: "pfpUrl",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="PFP" />
        ),
        cell: ({ row }) =>
          row.original?.pfpUrl ? (
            <Avatar>
              <AvatarImage src={row.original?.pfpUrl} />
            </Avatar>
          ) : null,
        show: true,
        title: "PFP",
      },
      {
        id: "user_full_name",
        accessorFn: (row) => `${row?.firstName ?? ""} ${row?.lastName ?? ""}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User Full Name" />
        ),
        title: "User Full Name",
        enableSorting: false,
      },
      {
        accessorKey: "firstName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User First Name" />
        ),
        show: false,
        title: "User First Name",
      },
      {
        accessorKey: "lastName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User Last Name" />
        ),
        show: false,
        title: "User Last Name",
      },
      {
        accessorKey: "username",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Username" />
        ),
        title: "Username",
      },
      {
        id: "tags",
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User Tags" />
        ),
        title: "User Tags",
        cell: ({ row }) => {
          return (
            row.original?.id && (
              <Suspense
                fallback={
                  <div className="w-full p-2">
                    <Skeleton className="" />{" "}
                  </div>
                }
              >
                <Tags
                  entityName="users"
                  entityId={row.original?.id}
                  getLinkedTags={getLinkedUserTags}
                  getAllTags={getAllTags}
                  linkTag={linkUserTag}
                  unlinkTag={unlinkUserTag}
                  createAndLinkTag={createAndLinkUserTag}
                />
              </Suspense>
            )
          );
        },
        show: false,
      },
      {
        id: "chatTags",
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Chat Tags" />
        ),
        title: "Chat Tags",
        cell: ({ row }) => {
          return (
            row.original?.id && (
              <Suspense
                fallback={
                  <div className="w-full p-2">
                    <Skeleton className=" h-8" />{" "}
                  </div>
                }
              >
                <Tags
                  entityName="chats"
                  entityId={row.original?.id}
                  getLinkedTags={getLinkedUserTags}
                  getAllTags={getAllTags}
                  linkTag={linkUserTag}
                  unlinkTag={unlinkUserTag}
                  createAndLinkTag={createAndLinkUserTag}
                />
              </Suspense>
            )
          );
        },
        show: true,
      },
      {
        id: "chatTags",
        accessorKey: "id",
        show: false,
        enableHiding: false,
      },
    ],
  },
  {
    header: "Stats",
    columns: [
      {
        accessorKey: "chatCount",
        header: "Chat Count",
        title: "Chat Count",
      },
      {
        accessorKey: "messageCount",
        header: "Message Count",
        title: "Message Count",
      },
      {
        id: "chats",
        accessorKey: "id",
        header: "Chats",
        show: true,
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {row.original.chatsList.map((chat) => (
              <Badge
                className="max-w-72 w-fit overflow-auto whitespace-nowrap overflow-ellipsis"
                key={chat.id}
              >
                {chat.title}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: "actions",
    title: "actions",
    border: false,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <AddToWorkspace user={user} />

            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                href={`/data/messages/?filter=${compressFilter([
                  {
                    id: "user_id",
                    value: [user.id],
                  },
                ])}&showFilters=true`}
              >
                View messages
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];

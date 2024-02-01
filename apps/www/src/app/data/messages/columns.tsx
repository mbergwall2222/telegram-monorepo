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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AddToWorkspace } from "./add-to-workspace";

export const columns: ColumnDefWithShow<IMessage>[] = [
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
      { accessorKey: "id", header: "Internal ID", show: false, border: "r" },
      {
        accessorKey: "messageId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Telegram ID" />
        ),
        title: "Telegram ID",
      },
      {
        accessorKey: "user.id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User ID" />
        ),
        show: false,
        title: "User ID",
      },
      {
        accessorKey: "chat.id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Chat ID" />
        ),
        show: false,
        title: "Chat ID",
      },
    ],
  },
  {
    header: "Message",
    columns: [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        title: "Date",
      },
      {
        accessorKey: "messageText",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Message Text" />
        ),
        cell: ({ row }) => (
          <Textarea
            className="w-72 min-h-0 h-12 resize disabled:cursor-default disabled:opacity-100"
            disabled
            value={row.original.messageText}
          />
        ),
        title: "Message Text",
        enableSorting: false,
      },
      {
        accessorKey: "inReplyToId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Reply to ID" />
        ),
        show: false,
        title: "Reply to ID",
      },
      {
        id: "hasMedia",
        accessorFn: (message) => !!message.document?.id,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Has Media" />
        ),
        show: false,
        title: "Has Media",
      },
      {
        id: "messageTags",
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tags" />
        ),
        title: "Message Tags",
        cell: ({ row }) => {
          return (
            <Suspense
              fallback={
                <div className="w-full">
                  <Skeleton className="w-full h-8" />
                </div>
              }
            >
              <Tags
                entityName="messages"
                entityId={row.original.id}
                getLinkedTags={getLinkedMessageTags}
                getAllTags={getAllTags}
                linkTag={linkMessageTag}
                unlinkTag={unlinkMessageTag}
                createAndLinkTag={createAndLinkMessageTag}
              />
            </Suspense>
          );
        },
        show: false,
      },
    ],
  },
  {
    header: "User",
    columns: [
      {
        accessorKey: "user.pfpUrl",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User PFP" />
        ),
        cell: ({ row }) =>
          row.original?.user?.pfpUrl ? (
            <Avatar>
              <AvatarImage src={row.original?.user?.pfpUrl} />
            </Avatar>
          ) : null,
        show: false,
        title: "User PFP",
      },
      {
        id: "user_full_name",
        accessorFn: (row) =>
          `${row?.user?.firstName ?? ""} ${row?.user?.lastName ?? ""}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User Full Name" />
        ),
        title: "User Full Name",
        enableSorting: false,
      },
      {
        accessorKey: "user.firstName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User First Name" />
        ),
        show: false,
        title: "User First Name",
      },
      {
        accessorKey: "user.lastName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User Last Name" />
        ),
        show: false,
        title: "User Last Name",
      },
      {
        accessorKey: "user.username",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Username" />
        ),
        title: "Username",
      },
      {
        id: "userTags",
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tags" />
        ),
        title: "User Tags",
        cell: ({ row }) => {
          return (
            row.original?.user?.id && (
              <Suspense
                fallback={
                  <div className="w-full p-2">
                    <Skeleton className="" />{" "}
                  </div>
                }
              >
                <Tags
                  entityName="users"
                  entityId={row.original?.user?.id}
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
    ],
  },

  {
    header: "Chat",
    columns: [
      {
        accessorKey: "chat.title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        title: "Chat Title",
      },
      {
        accessorKey: "chat.isGroup",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Is Group?" />
        ),
        cell: (data) =>
          data.getValue() ? (
            <Badge variant="outline">Yes</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          ),
        title: "Chat is Group?",
        enableSorting: false,
      },
      {
        accessorKey: "chat.isChannel",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Is Channel?" />
        ),
        title: "Chat is Channel?",
        cell: (data) =>
          data.getValue() ? (
            <Badge variant="outline">Yes</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          ),
        enableSorting: false,
        show: false,
      },
      {
        accessorKey: "chat.pfpUrl",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="PFP" />
        ),
        cell: ({ row }) =>
          row.original?.chat?.pfpUrl ? (
            <Avatar>
              <AvatarImage src={row.original.chat.pfpUrl} />
            </Avatar>
          ) : null,
        show: false,
        title: "Chat PFP",
      },
      {
        id: "chatTags",
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tags" />
        ),
        title: "Chat Tags",
        cell: ({ row }) => {
          return (
            row.original?.chat?.id && (
              <Suspense
                fallback={
                  <div className="w-full p-2">
                    <Skeleton className="" />{" "}
                  </div>
                }
              >
                <Tags
                  entityName="chats"
                  entityId={row.original?.chat?.id}
                  getLinkedTags={getLinkedChatTags}
                  getAllTags={getAllTags}
                  linkTag={linkChatTag}
                  unlinkTag={unlinkChatTag}
                  createAndLinkTag={createAndLinkChatTag}
                />
              </Suspense>
            )
          );
        },
        show: false,
      },
    ],
  },

  {
    id: "actions",
    title: "actions",
    border: false,
    cell: ({ row }) => {
      const message = row.original;

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
            <AddToWorkspace message={message} />
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];

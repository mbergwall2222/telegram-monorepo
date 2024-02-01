"use client";

import { Button } from "@/components/ui/button";
import { formatRelative } from "date-fns";
import {
  Video,
  ImageIcon,
  Sticker,
  FileText,
  MoreHorizontal,
  Tags,
} from "lucide-react";
import { db } from "@telegram/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lottie } from "@/components/messages/message/lottie";
import { DocViewer } from "@/components/messages/message/doc_viewer";
import { Suspense, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NewTagCommand } from "@/components/chats/tags/new_tag";
import {
  getLinkedMessageTags,
  unlinkMessageTag,
  createAndLinkMessageTag,
  getAllTags,
  linkMessageTag,
} from "@/lib/client/api";

type MessageType = Awaited<
  ReturnType<
    typeof db.query.messages.findMany<{
      with: { chat: true; user: true; document: true };
    }>
  >
>[number];

const combineNames = (...names: any[]) => {
  return names.filter(Boolean).join(" ");
};

const getIcon = (mimeType: string) => {
  const className = "mr-2 h-4 w-4";
  if (mimeType.includes("video")) return <Video className={className} />;
  else if (mimeType.includes("image"))
    return <ImageIcon className={className} />;
  else if (mimeType.includes("tgsticker"))
    return <Sticker className={className} />;
  else return <FileText className={className} />;
};

const getMedia = (mimeType: string, fileUrl: string) => {
  if (mimeType.includes("tgsticker")) return <Lottie fileUrl={fileUrl} />;
  return (
    <DocViewer
      documents={[{ uri: fileUrl, fileType: mimeType }]}
      initialActiveDocument={{ uri: fileUrl, fileType: mimeType }}
    />
  );
};

export const Message = ({ message }: { message: MessageType }) => {
  const name = message.user?.id
    ? combineNames(
        message.user?.firstName,
        message.user?.lastName,
        message.user?.username ? `(@${message.user?.username})` : null
      )
    : message?.chat?.id
      ? message?.chat?.title
      : null;

  const [showMedia, setShowMedia] = useState(false);

  return (
    <div className="flex w-full  flex-col gap-2 shadow rounded-lg p-2 overflow-hidden dark:border border-gray-500">
      <div className="flex w-full  items-center justify-between">
        <div className="flex gap-4 items-center overflow-hidden">
          {message.user && (
            <>
              <div className="flex gap-2 items-center">
                <Avatar className="border w-10 h-10">
                  <AvatarImage
                    alt="Image"
                    src={message.user?.pfpUrl ?? undefined}
                  />
                  <AvatarFallback>
                    {name
                      ?.match(/\b(\w)/g)
                      ?.slice(0, 3)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                  <p className="text-sm font-medium leading-none whitespace-nowrap overflow-ellipsis">
                    {name}
                  </p>
                  {!!message.user?.username?.length && (
                    <p className="text-xs text-gray-500 dark:text-gray-400  whitespace-nowrap">
                      @{message.user.username}
                    </p>
                  )}
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
            </>
          )}

          <div className="flex gap-2 items-center">
            <Avatar className="border w-10 h-10">
              <AvatarImage alt="Image" src={message.chat.pfpUrl ?? undefined} />
              <AvatarFallback>
                {message.chat.title
                  ?.match(/\b(\w)/g)
                  ?.slice(0, 3)
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5">
              <p className="text-sm font-medium leading-none whitespace-nowrap overflow-ellipsis">
                {message.chat.title}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Remove from Workspace</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="mr-2 h-4 w-4" />
                  Edit Tags
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <Suspense fallback={<div>Loading...</div>}>
                    <NewTagCommand
                      entityName="messages"
                      entityId={message.id}
                      getLinkedTags={getLinkedMessageTags}
                      getAllTags={getAllTags}
                      linkTag={linkMessageTag}
                      unlinkTag={unlinkMessageTag}
                      createAndLinkTag={createAndLinkMessageTag}
                    />
                  </Suspense>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />
      <div className="flex text-sm px-4 leading-5 whitespace-pre-wrap">
        {!!message.messageText?.length ? (
          message.messageText
        ) : (
          <span className="text-gray-500 italic">
            This message is media only.
          </span>
        )}
      </div>
      <div className="flex items-center justify-between w-full p-2 pb-0  border-t border-gray-200">
        {message.document ? (
          <Button variant="ghost" onClick={() => setShowMedia(!showMedia)}>
            {getIcon(message.document.mimeType)}
            {showMedia ? "Hide" : "Show"} Media
          </Button>
        ) : (
          <div></div>
        )}
        <div className="text-xs whitespace-nowrap ">
          {formatRelative(message.date, new Date())}
        </div>
      </div>
      {showMedia && message.document && (
        <div className="flex justify-center py-2">
          {getMedia(message.document.mimeType, message.document.fileUrl)}
        </div>
      )}
      <ScrollArea orientation="horizontal">
        <div className="text-xs text-gray-500 p-2 pt-0 flex gap-2 flex-nowrap w-full whitespace-nowrap h-full">
          Internal ID: <pre>{message.id}</pre>
          Telegram Message ID: <pre>{message.messageId}</pre>
          {message.user?.id && (
            <>
              Internal User ID: <pre>{message.user?.id}</pre>
            </>
          )}
          {message.user?.userId && (
            <>
              Telegram User ID: <pre>{message.user?.userId}</pre>
            </>
          )}
          {message.chat?.id && (
            <>
              Internal Chat ID: <pre>{message.chat?.id}</pre>
            </>
          )}
          {message.chat?.telegramId && (
            <>
              Telegram Chat ID: <pre>{message.chat?.telegramId}</pre>
            </>
          )}
          Timestamp:
          <pre>
            {message.date instanceof Date
              ? message.date.toISOString()
              : message.date}
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
};

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { formatDistance } from "date-fns";
import { useInterval } from "usehooks-ts";
import { Ref, Suspense, forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChatTimestamp } from "./chat_timestamp";
import { Badge } from "@/components/ui/badge";
import { Tags } from "../tags/tags";
import {
  createAndLinkChatTag,
  getAllTags,
  getLinkedChatTags,
  linkChatTag,
  unlinkChatTag,
} from "@/lib/client/api";

type IChatProps = {
  id: string;
  pfpUrl?: string;
  title: string;
  date?: Date;
  ref?: Ref<HTMLAnchorElement>;
  selected?: boolean;
};
export const Chat = ({
  id,
  pfpUrl,
  title,
  date,
  ref,
  selected,
}: IChatProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-2 rounded-lg  border-b rounded-b-none  border-gray-800 w-full overflow-hidden",
        selected
          ? "bg-gray-400/50 dark:bg-gray-800/50 border-b-0"
          : "hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
      )}
    >
      <Link
        className="flex items-center gap-4 flex-1  flex-grow"
        href={`/chats/${id}`}
      >
        <Avatar className="border w-10 h-10">
          {pfpUrl && <AvatarImage alt="Image" src={pfpUrl} />}
          <AvatarFallback>
            {title
              ?.match(/\b(\w)/g)
              ?.slice(0, 3)
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="grid gap-0.5">
          <p className="text-sm font-medium leading-none whitespace-nowrap overflow-ellipsis">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400  whitespace-nowrap">
            {date && <ChatTimestamp date={date} />}
          </p>
        </div>
      </Link>
      <div className="hidden sm:flex">
        <Suspense fallback={<div>Loading...</div>}>
          <Tags
            entityName="chats"
            entityId={id}
            getLinkedTags={getLinkedChatTags}
            getAllTags={getAllTags}
            linkTag={linkChatTag}
            unlinkTag={unlinkChatTag}
            createAndLinkTag={createAndLinkChatTag}
          />
        </Suspense>
      </div>
    </div>
  );
};

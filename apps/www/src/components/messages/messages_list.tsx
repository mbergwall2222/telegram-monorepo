"use client";
import React, { useContext, useEffect } from "react";
import { JSONData, Page, RecordArray, SelectedPick } from "@xata.io/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelative } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesRecord } from "@/lib/xata";
import { ChatsContext } from "@/context/chats";
import { MessageEntity } from "@/lib/types/telegram";
import ReactPlayer from "react-player";
import { Message } from "../messages/message/message";
import { LayoutGroup } from "framer-motion";
import { IMessage } from "@/lib/types/messages";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  getChatMessages,
  getMessages,
  searchForMessages,
} from "@/lib/client/api";
import { useInView } from "react-intersection-observer";
import { MessageLoader } from "./message/message_loader";

export const MessagesList = ({ query }: { query?: string }) => {
  return null;
  // const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
  //   queryKey: ["messages", query],
  //   queryFn: ({ pageParam }) => {
  //     if (query) return searchForMessages(query);
  //     else return getMessages({ cursor: pageParam });
  //   },
  //   initialPageParam: "",
  //   refetchInterval: query ? undefined : 5000,
  //   getNextPageParam: (data) =>
  //     data.meta.page.more ? data.messages.meta.page.cursor : undefined,
  // });

  // const { ref, inView, entry } = useInView({
  //   /* Optional options */
  //   threshold: 0,
  // });

  // const messages = data?.pages.flatMap((page) => page.messages.records) ?? [];

  // const buildMessageThread = (
  //   message: IMessage,
  //   isReply = false,
  //   isTop = false
  // ) => {
  //   let reply: React.ReactNode | undefined;
  //   if (message.inReplyToId) {
  //     const parentMessage = messages.find(
  //       (o) => o.messageId == message.inReplyToId
  //     );
  //     if (!parentMessage)
  //       reply = (
  //         <MessageLoader
  //           key={message.id}
  //           messageId={`chat-${message.toChat.id}-message-${message.inReplyToId}`}
  //           isReply={true}
  //           reply={reply}
  //           isTop={isTop}
  //           showChat={!isReply}
  //         />
  //       );
  //     else reply = buildMessageThread(parentMessage, true);
  //   }
  //   return (
  //     <Message
  //       key={message.id}
  //       message={message}
  //       isReply={isReply}
  //       reply={reply}
  //       isTop={isTop}
  //       showChat={!isReply}
  //     />
  //   );
  // };

  // useEffect(() => {
  //   if (inView && hasNextPage) fetchNextPage();
  // }, [inView, hasNextPage]);

  // // const messagesWithReplies = messages.map((message) => ({
  // //   ...message,
  // //   inReplyToId: message.inReplyToId
  // //     ? messages.find((o) => o.messageId == message.inReplyToId)
  // //       ? message.inReplyToId
  // //       : "Not Loaded"
  // //     : undefined,
  // // }));

  // return (
  //   <ScrollArea className="flex flex-col px-12 h-[calc(100vh-52px)] flex-grow py-6 scroll-auto">
  //     <LayoutGroup>
  //       {messages.map((message, i) => {
  //         if (messages.length - i == 5)
  //           return (
  //             <>
  //               {buildMessageThread(message, false, i == 0)}
  //               <div ref={ref} className="w-full h-1"></div>
  //             </>
  //           );
  //         else return buildMessageThread(message, false, i == 0);
  //       })}
  //     </LayoutGroup>
  //   </ScrollArea>
  // );
};

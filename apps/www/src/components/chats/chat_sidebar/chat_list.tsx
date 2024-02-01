"use client";

import { Chat } from "../chat/chat";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChatsContext } from "@/context/chats";
import { LayoutGroup, MotionDiv } from "@/components/ui/use-motion";
import { useInterval } from "usehooks-ts";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getChat, getChats, searchForChats } from "@/lib/client/api";
import { useInView } from "react-intersection-observer";
import { PusherContext } from "@/context/pusher";
import { IChat, IGetChatsResponse } from "@/lib/types/chats";

type IChatListProps = {
  searchQuery: string;
};

export const ChatList = ({ searchQuery }: IChatListProps) => {
  const [chatUpdates, setChatUpdates] = useState<IChat[]>([]);
  const { chatId } = useParams();
  const queryClient = useQueryClient();

  const { data, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
    queryKey: ["chats", searchQuery],
    queryFn: async ({ pageParam }) => {
      if (searchQuery) {
        let currentOffset = parseInt(pageParam) ?? 0;
        let nextOffset = currentOffset + 10;
        let chats = await searchForChats(searchQuery);
        return chats;
      }
      return getChats(pageParam);
    },
    staleTime: Infinity,
    gcTime: 0,
    initialPageParam: "",
    getNextPageParam: (lastPage) =>
      lastPage.page.next == -1 ? undefined : `${lastPage.page.next}`,
  });

  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  });

  const { pusher } = useContext(PusherContext);

  const chats = useMemo(() => {
    let currentChats = data?.pages.flatMap((page) => page?.chats) ?? [];
    const newChats = searchQuery
      ? []
      : chatUpdates.filter((o) => !currentChats.find((o2) => o2.id == o.id));

    currentChats = currentChats.map((chat) => {
      const update = chatUpdates.find((o) => o.id == chat.id);
      if (
        update &&
        (update.lastMessageDate
          ? new Date(update.lastMessageDate).getTime()
          : 0) >
          (chat.lastMessageDate ? new Date(chat.lastMessageDate).getTime() : 0)
      ) {
        return update;
      }
      return chat;
    });

    return [...newChats, ...currentChats].sort((a, b) => {
      return (
        new Date(b.lastMessageDate ?? 0).getTime() -
        new Date(a.lastMessageDate ?? 0).getTime()
      );
    });
  }, [data, chatUpdates, searchQuery]);

  const getSelectedChat = useCallback(() => {
    if (!chatId || typeof chatId != "string") return null;

    return getChat(chatId);
  }, [chatId, chats]);

  const { data: selectedChatData } = useQuery({
    queryKey: ["selectedChat", chatId],
    queryFn: () => {
      return getSelectedChat();
    },
    staleTime: Infinity,
  });

  const selectedChat = useMemo(() => {
    if (!selectedChatData) return;
    const chat = chats.find((o) => o.id == chatId);
    if (chat) return chat;
    else return selectedChatData.chat;
  }, [selectedChatData, chats]);

  const handleNewChatUpdate = useCallback(
    (data: IChat) => {
      const oldChat = chats.find((o) => o.id == data.id);
      const newChatDate = new Date(data.lastMessageDate);
      const existingUpdate = chatUpdates.find((o) => o.id == data.id);
      const otherUpdates = chatUpdates.filter((o) => o.id != data.id);
      if (existingUpdate) {
        const oldChatDate = new Date(existingUpdate.lastMessageDate);
        if (newChatDate.getTime() < oldChatDate.getTime()) return;
      } else if (oldChat) {
        const oldChatDate = new Date(oldChat.lastMessageDate);
        if (newChatDate.getTime() < oldChatDate.getTime()) return;
      } else {
        if (!oldChat)
          return queryClient.invalidateQueries({ queryKey: ["chats"] });
      }

      setChatUpdates([data, ...otherUpdates]);
    },
    [chatUpdates, chats]
  );

  useEffect(() => {
    if (!pusher) return;
    const channel1 = pusher.subscribe("chats");
    // You can bind more channels here like this
    // const channel2 = pusher.subscribe('channel_name2')

    channel1.bind("chat_update", handleNewChatUpdate);

    return () => {
      pusher.unsubscribe("chats");
      // pusher.unsubscribe('channel_name2')
    };
  }, [handleNewChatUpdate, pusher]);
  // const { chatId } = useParams();
  // const { chats } = useContext(ChatsContext);

  const filteredChats = selectedChat
    ? chats.filter((chat) => chat.id !== selectedChatData?.chat?.id)
    : chats;

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage]);

  return (
    <div className="flex flex-grow flex-col h-full overflow-auto">
      <LayoutGroup>
        {selectedChat && (
          <MotionDiv
            key={selectedChat.id}
            layout="position"
            transition={{
              layout: {
                duration: 1.5,
              },
            }}
            // layout="position"
            // layoutId="selected"
          >
            <Chat
              key={selectedChat.id}
              id={selectedChat.id}
              title={selectedChat.title ?? ""}
              date={
                selectedChat.lastMessageDate
                  ? new Date(selectedChat.lastMessageDate)
                  : undefined
              }
              pfpUrl={selectedChat.pfpUrl ?? undefined}
              selected={true}
            />
          </MotionDiv>
        )}

        {filteredChats.map((chat, i) => (
          <MotionDiv
            key={chat.id}
            ref={chats.length - i == 5 ? ref : undefined}
            layout="position"
          >
            <Chat
              key={chat.id}
              id={chat.id}
              title={chat.title ?? ""}
              date={
                chat.lastMessageDate
                  ? new Date(chat.lastMessageDate)
                  : undefined
              }
              pfpUrl={chat.pfpUrl ?? undefined}
            />
          </MotionDiv>
        ))}
      </LayoutGroup>
    </div>
  );
};

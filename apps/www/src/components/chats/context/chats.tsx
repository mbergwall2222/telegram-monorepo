"use client";

import { ChatsContext } from "@/context/chats";
import { PusherContext } from "@/context/pusher";
import mitt, { Emitter, EventType } from "mitt";
import { useContext, useEffect, useState } from "react";

const getChats = async () => {
  return fetch("/api/chats").then(
    (res) => res.json() as Promise<{ chats: IChat[] }>
  );
};

export const Chats = ({
  children,
  chats: initialChats,
}: {
  children: React.ReactNode;
  chats: IChat[];
}) => {
  // const { pusher } = useContext(PusherContext);

  const [chats, setChats] = useState<IChat[]>(initialChats);

  const syncChats = () => {
    return getChats().then(({ chats }) => {
      setChats(chats);
    });
  };

  // useEffect(() => {
  //   if (!pusher) return;
  //   const channel1 = pusher.subscribe("chats");
  //   // You can bind more channels here like this
  //   // const channel2 = pusher.subscribe('channel_name2')
  //   channel1.bind(
  //     "new_message",
  //     function (data: { chatId: string; messageId: string; date: string }) {
  //       const chat = chats.find((chat) => chat.id === data.chatId);
  //       if (!chat) return syncChats();
  //       chat.lastMessageDate = new Date(data.date).toISOString();

  //       const newChats = chats
  //         .filter((chat) => chat.id !== data.chatId)
  //         .sort((a, b) => {
  //           return (
  //             new Date(b.lastMessageDate ?? 0).getTime() -
  //             new Date(a.lastMessageDate ?? 0).getTime()
  //           );
  //         });
  //       setChats([chat, ...newChats]);
  //       // Code that runs when channel1 listens to a new message
  //     }
  //   );

  //   return () => {
  //     pusher.unsubscribe("chats");
  //     // pusher.unsubscribe('channel_name2')
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  return (
    <ChatsContext.Provider value={{ chats, isLoading: false }}>
      {children}
    </ChatsContext.Provider>
  );
};

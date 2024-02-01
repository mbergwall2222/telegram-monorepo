import { ChatsContext } from "@/context/chats";
import { getXataClient } from "@/lib/xata";
import { Chats } from "./chats";

const xata = getXataClient();

export const ChatsStore = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const _chats = await xata.db.chats.getMany({
    pagination: { size: 20 },
    sort: { lastMessageDate: "desc" },
  });

  const chats = _chats.map((chat) => chat.toSerializable() as IChat);
  return <Chats chats={chats}> {children} </Chats>;
};

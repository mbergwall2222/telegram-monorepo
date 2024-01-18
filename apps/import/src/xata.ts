import { getXataClient } from "@telegram/xata";
import { kafka } from "@telegram/kafka";
import { NewUpdateEvent } from "@telegram/types";

const xata = getXataClient();
const producer = kafka.producer();
console.log("Connecting to kafka");
await producer.connect();

let messagesRaw = await xata.db.messages
  .select(["*", "fromUser.*", "toChat.*", "media.*"])
  .getPaginated({ pagination: { size: 1000 } });

  let totalSent = 0;
while(messagesRaw.records.length) {
  const messages: NewUpdateEvent[] = messagesRaw.records.map((message) => {
    return {
      id: message.id,
      date: message.date?.toISOString() ?? (new Date()).toISOString(),
      messageId: message.messageId as string,
      messageText: message.messageText ?? "",
      fromUser: message.fromUser?.id,
      toChat: message.toChat?.id as string,
      fromUserFull:  message.fromUser ? {
        id: message.fromUser.id,
        firstName: message.fromUser.firstName ?? "",
        lastName: message.fromUser.lastName ?? "",
        username: message.fromUser.username ?? "",
        pfpUrl: message.fromUser.pfpUrl ?? "",
      } : undefined,
      fromChatFull: message.toChat ? {
        id: message.toChat.id,
        isGroup: message.toChat.isGroup ?? false,
        isChannel: message.toChat.isChannel ?? false,
        title: message.toChat.title ?? "",
        memberCount: message.toChat.memberCount ?? -1,
        pfpUrl: message.toChat.pfpUrl ?? "",
      } : undefined,
      groupId: message.groupId as string,
      inReplyToId: message.inReplyToId as string,
      media: message.media ? {
        fileId: message.media.fileId as string,
        fileName: message.media.fileName as string,
        fileSize: message.media.fileSize as number,
        mimeType: message.media.mimeType as string,
        fileUrl: message.media.fileUrl as string,
      } : undefined
    }
  });
  
  totalSent += messages.length;
  console.log("sending..")
  const output = await producer.send({
    topic: "messages-new",
    messages: messages.map(o => ({value: JSON.stringify(o)}))
  });
  
  console.log(messagesRaw.meta.page.cursor);
  console.log("sent", totalSent)

  messagesRaw = await messagesRaw.nextPage();
}

import { NewUpdateEvent } from "@telegram/types";
import { kafka } from "@telegram/kafka";
import { logger } from "@telegram/logger";
import {
  doesHashMatch,
  ensureString,
  setHash,
  toValidUTF8,
} from "@telegram/utils";
import { redis } from "@telegram/redis";
import {
  chats,
  db,
  documents,
  keysFromObject,
  messages,
  sql,
  users,
} from "@telegram/db";
import { env } from "@telegram/env";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: "app-id",
  key: "app-key",
  secret: "app-secret",
  useTLS: true, // optional, defaults to false
  cluster: "CLUSTER", // if `host` is present, it will override the `cluster` option.
  host: "x21-ws.mattbergwall.com", // optional, defaults to api.pusherapp.com
  port: "443", // optional, defaults to 80 for non-TLS connections and 443 for TLS connections
});

const consumer = kafka.consumer({ groupId: env.KAFKA_CONSUMER_GROUP_ID });

function getUniqueByKey<T, K extends keyof T>(arr: T[], key: K): T[] {
  const seen = new Set<T[K]>();
  const uniqueArr = arr.filter((obj) => {
    const keyValue = obj[key];
    if (!seen.has(keyValue)) {
      seen.add(keyValue);
      return true;
    }
    return false;
  });
  return uniqueArr;
}
const run = async () => {
  // Connect the consumer
  console.log("Connecting to Kafka");
  await consumer.connect();
  const topics = env.KAFKA_MESSAGES_TOPIC.split(",");
  console.log("Subscribing to topics " + topics.join(", "));
  for (const topic of topics) {
    await consumer.subscribe({
      topic,
      fromBeginning: false,
    });
  }

  console.log("Running...");
  await consumer.run({
    eachBatchAutoResolve: true,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      uncommittedOffsets,
      isRunning,
      isStale,
      pause,
    }) => {
      console.log(`Processing batch of size ${batch.messages.length}`);
      const valuesD = batch.messages
        .filter((m) => m.value != null)
        .map((m) => {
          // console.log(m);
          if (typeof m.value == "string")
            return JSON.parse(m.value) as NewUpdateEvent;
          else if (m.value instanceof Buffer) {
            const val = JSON.parse(m.value.toString("utf8"));
            if (typeof val == "string")
              return JSON.parse(val) as NewUpdateEvent;
            else return val as NewUpdateEvent;
          } else return {} as NewUpdateEvent;
        });

      const values = valuesD.filter(
        (value) => value.fromChatFull && value.fromChatFull?.id
      );

      const usersRaw = values
        .filter((value) => value.fromUserFull)
        .map((value) => ({
          userId: value!.fromUserFull!.id,
          firstName: toValidUTF8(value!.fromUserFull!.firstName),
          lastName: toValidUTF8(value!.fromUserFull!.lastName),
          username: value!.fromUserFull!.username,
          pfpUrl: value.fromUserFull!.pfpUrl,
          description: value.fromUserFull?.description
            ? toValidUTF8(value.fromUserFull.description)
            : undefined,
        }));

      const uniqueUsers = getUniqueByKey(usersRaw, "userId");
      const usersRes = uniqueUsers.length
        ? await db
            .insert(users)
            .values(uniqueUsers)
            .onConflictDoUpdate({
              target: users.userId,
              set: Object.assign(
                {},
                ...keysFromObject(usersRaw[0])
                  .filter((k) => k !== "userId")
                  .map((k) => ({ [k]: sql.raw(`excluded.${users[k].name}`) }))
              ) as Partial<any>,
            })
            .returning()
        : [];

      await heartbeat();

      const chatsRaw = values.map((value) => ({
        telegramId: value.fromChatFull!.id,
        isGroup: value.fromChatFull!.isGroup,
        isChannel: value.fromChatFull!.isChannel,
        title: toValidUTF8(value.fromChatFull!.title),
        memberCount:
          value.fromChatFull!.memberCount !== null
            ? `${value.fromChatFull!.memberCount}`
            : undefined,
        pfpUrl: value.fromChatFull!.pfpUrl,
        lastMessageDate: new Date(value.date),
        session: value.session,
        description: value.fromChatFull!.description
          ? toValidUTF8(value.fromChatFull!.description)
          : undefined,
      }));

      const uniqueChats = getUniqueByKey(chatsRaw, "telegramId");
      const chatsRes = uniqueChats.length
        ? await db
            .insert(chats)
            .values(uniqueChats)
            .onConflictDoUpdate({
              target: chats.telegramId,
              set: Object.assign(
                {},
                ...keysFromObject(chatsRaw[0])
                  .filter((k) => k !== "telegramId")
                  .map((k) => ({ [k]: sql.raw(`excluded.${chats[k].name}`) }))
              ) as Partial<any>,
            })
            .returning()
        : [];
      await heartbeat();

      const documentsRaw = values
        .filter((value) => value.media)
        .map((value) => ({
          fileId: value.media!.fileId,
          fileName: value.media!.fileName,
          fileSize: `${value.media!.fileSize}`,
          mimeType: value.media!.mimeType,
          fileUrl: value.media!.fileUrl,
        }));

      const uniqueDocuments = getUniqueByKey(documentsRaw, "fileId");
      const documentsRes = uniqueDocuments.length
        ? await db
            .insert(documents)
            .values(uniqueDocuments)
            .onConflictDoNothing()
            .returning()
        : [];
      await heartbeat();

      const usersMap = new Map(usersRes.map((user) => [user.userId, user]));
      const chatsMap = new Map(chatsRes.map((chat) => [chat.telegramId, chat]));
      const documentsMap = new Map(
        documentsRes.map((document) => [document.fileId, document])
      );

      const messagesRaw = values.map((value) => ({
        date: new Date(value.date),
        messageId: ensureString(value.messageId),
        messageText: toValidUTF8(value.messageText),
        userId: value?.fromUserFull?.id
          ? usersMap.get(value.fromUserFull.id)?.id
          : undefined,
        chatId: chatsMap.get(value.fromChatFull!.id)?.id as string,
        documentId:
          value.mediaId ||
          (value.media?.fileId
            ? documentsMap.get(value.media?.fileId)?.id
            : undefined),
        groupId: value.groupId,
        inReplyToId: value.inReplyToId,
        entities: value.entities,
      }));

      const messagesRes = messagesRaw.length
        ? await db
            .insert(messages)
            .values(messagesRaw)
            .onConflictDoNothing()
            .returning()
        : [];

      console.log("Successfully processed batch of size " + messagesRes.length);

      try {
        await pusher.triggerBatch(
          chatsRes.map((chat) => ({
            channel: "chats",
            name: "chat_update",
            data: chat,
          }))
        );
      } catch (e) {
        console.error(e);
      }

      await heartbeat();
    },
  });

  // await consumer.run({
  //   eachMessage: async ({ topic, partition, message }) => {
  //     const event = JSON.parse(
  //       message.value?.toString() || "{}"
  //     ) as NewUpdateEvent;

  //     const log = logger.child({ logId: event.id });

  //     log.info("Processing message");

  //     let user;

  //     if (
  //       event.fromUserFull //&&
  //       // !(await doesHashMatch(
  //       //   event.fromUserFull.id,
  //       //   event.fromUserFull,
  //       //   "user"
  //       // ))
  //     ) {
  //       log.debug("Creating or updating user");

  //       const data = {
  //         userId: event.fromUserFull.id,
  //         firstName: toValidUTF8(event.fromUserFull.firstName),
  //         lastName: toValidUTF8(event.fromUserFull.lastName),
  //         username: event.fromUserFull.username,
  //         pfpUrl: event.fromUserFull.pfpUrl,
  //         description: event.fromUserFull.description
  //           ? toValidUTF8(event.fromUserFull.description)
  //           : undefined,
  //       };

  //       user = (
  //         await db
  //           .insert(users)
  //           .values(data)
  //           .onConflictDoUpdate({ target: users.userId, set: data })
  //           .returning()
  //       )[0];
  //       // await db.insert(users).values;
  //       // user = await db.users.createOrUpdate(event.fromUserFull.id, );

  //       await setHash(event.fromUserFull.id, event.fromUserFull, "user");
  //     } else {
  //       log.debug("User already exists");
  //     }

  //     if (!user)
  //       user = event.fromUserFull?.id
  //         ? { id: event.fromUserFull?.id }
  //         : undefined;

  //     let chat;

  //     if (event.fromChatFull) {
  //       const chatLastMessageDate = await redis.get(
  //         `chat:${event.fromChatFull.id}:lastMessageDate`
  //       );

  //       if (
  //         true ||
  //         !chatLastMessageDate ||
  //         Date.parse(chatLastMessageDate as string) <
  //           Date.parse(event.date as string)
  //       ) {
  //         log.debug("Creating or updating chat (newer message)");
  //         const data = {
  //           telegramId: event.fromChatFull.id,
  //           isGroup: event.fromChatFull.isGroup,
  //           isChannel: event.fromChatFull.isChannel,
  //           title: toValidUTF8(event.fromChatFull.title),
  //           memberCount:
  //             event.fromChatFull.memberCount !== null
  //               ? `${event.fromChatFull.memberCount}`
  //               : undefined,
  //           pfpUrl: event.fromChatFull.pfpUrl,
  //           lastMessageDate: new Date(event.date),
  //           description: event.fromChatFull.description
  //             ? toValidUTF8(event.fromChatFull.description)
  //             : undefined,
  //         };

  //         chat = (
  //           await db
  //             .insert(chats)
  //             .values({ ...data })
  //             .onConflictDoUpdate({ target: chats.telegramId, set: data })
  //             .returning()
  //         )[0];

  //         await redis.set(
  //           `chat:${event.fromChatFull.id}:lastMessageDate`,
  //           event.date as string
  //         );
  //         await setHash(event.fromChatFull.id, event.fromChatFull, "chat");

  //         // await pusher.trigger("chats", "chat_update", {
  //         //   ...chat.toSerializable(),
  //         // });
  //       }
  //     } else {
  //       log.debug("Chat already exists");
  //     }

  //     // if (!chat)
  //     //   chat = event.fromChatFull?.id
  //     //     ? { id: event.fromChatFull?.id }
  //     //     : undefined;

  //     let mediaId = event.mediaId;
  //     let document;
  //     if (event.media) {
  //       log.debug("Creating media");
  //       document = (
  //         await db
  //           .insert(documents)
  //           .values({
  //             fileId: event.media.fileId,
  //             fileName: event.media.fileName,
  //             fileSize: `${event.media.fileSize}`,
  //             mimeType: event.media.mimeType,
  //             fileUrl: event.media.fileUrl,
  //           })
  //           .returning()
  //       )[0];

  //       mediaId = document.id;
  //       await redis.set(`file:${event.media.fileId}`, document.id);
  //     } else if (mediaId) {
  //       log.debug("Media already exists");
  //     }

  //     if (typeof event.entities == "object")
  //       event.entities = JSON.stringify(event.entities);

  //     const createdMessage = await db
  //       .insert(messages)
  //       .values({
  //         date: new Date(event.date),
  //         messageId: ensureString(event.messageId),
  //         messageText: toValidUTF8(event.messageText),
  //         userId: user?.id,
  //         chatId: chat?.id as string,
  //         documentId: mediaId,
  //         groupId: event.groupId,
  //         inReplyToId: event.inReplyToId,
  //         entities: event.entities,
  //       })
  //       .onConflictDoNothing();

  //     // await pusher.trigger("chats", "new_message", {
  //     //   chatId: event?.fromChatFull?.id,
  //     //   messageId: event.messageId,
  //     //   messageText: toValidUTF8(event.messageText),
  //     //   fromUser: event.fromUserFull,
  //     //   toChat: event.fromChatFull,
  //     //   media: event.media,
  //     //   groupId: event.groupId,
  //     //   inReplyToId: event.inReplyToId,
  //     //   entities: event.entities,
  //     //   d
  //     // });

  //     log.info(`Created Message`);
  //   },
  // });
};

run().catch((e) => console.error("[example/consumer] e.message", e));

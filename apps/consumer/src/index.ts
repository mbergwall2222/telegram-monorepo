import {
  MessagesRecord,
  UsersRecord,
  ChatsRecord,
  getXataClient,
  DocumentsRecord,
} from "@telegram/xata";
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
const consumer = kafka.consumer({ groupId: "worker" });

const xata = getXataClient();

const run = async () => {
  // Connect the consumer
  await consumer.connect();
  await consumer.subscribe({ topic: "messages", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(
        message.value?.toString() || "{}"
      ) as NewUpdateEvent;

      const log = logger.child({ logId: event.id });

      log.info("Processing message");

      let user;

      if (
        event.fromUserFull &&
        !(await doesHashMatch(
          event.fromUserFull.id,
          event.fromUserFull,
          "user"
        ))
      ) {
        log.debug("Creating or updating user");
        user = await xata.db.users.createOrUpdate(event.fromUserFull.id, {
          userId: event.fromUserFull.id,
          firstName: toValidUTF8(event.fromUserFull.firstName),
          lastName: toValidUTF8(event.fromUserFull.lastName),
          username: event.fromUserFull.username,
          pfpUrl: event.fromUserFull.pfpUrl,
          description: event.fromUserFull.description
            ? toValidUTF8(event.fromUserFull.description)
            : undefined,
        });

        await setHash(event.fromUserFull.id, event.fromUserFull, "user");
      } else {
        log.debug("User already exists");
      }

      if (!user)
        user = event.fromUserFull?.id
          ? { id: event.fromUserFull?.id }
          : undefined;

      let chat;

      if (event.fromChatFull) {
        const chatLastMessageDate = await redis.get(
          `chat:${event.fromChatFull.id}:lastMessageDate`
        );

        if (
          !chatLastMessageDate ||
          Date.parse(chatLastMessageDate as string) <
            Date.parse(event.date as string)
        ) {
          log.debug("Creating or updating chat (newer message)");
          chat = await xata.db.chats.createOrUpdate(event.fromChatFull.id, {
            isGroup: event.fromChatFull.isGroup,
            isChannel: event.fromChatFull.isChannel,
            title: toValidUTF8(event.fromChatFull.title),
            memberCount:
              event.fromChatFull.memberCount !== null
                ? event.fromChatFull.memberCount
                : undefined,
            pfpUrl: event.fromChatFull.pfpUrl,
            lastMessageDate: event.date,
            description: event.fromChatFull.description
              ? toValidUTF8(event.fromChatFull.description)
              : undefined,
          });
          await redis.set(
            `chat:${event.fromChatFull.id}:lastMessageDate`,
            event.date as string
          );
          await setHash(event.fromChatFull.id, event.fromChatFull, "chat");

          // await pusher.trigger("chats", "chat_update", {
          //   ...chat.toSerializable(),
          // });
        }
      } else {
        log.debug("Chat already exists");
      }

      if (!chat)
        chat = event.fromChatFull?.id
          ? { id: event.fromChatFull?.id }
          : undefined;

      let mediaId = event.mediaId;
      let document;
      if (event.media) {
        log.debug("Creating media");
        document = await xata.db.documents.create({
          fileId: event.media.fileId,
          fileName: event.media.fileName,
          fileSize: event.media.fileSize,
          mimeType: event.media.mimeType,
          fileUrl: event.media.fileUrl,
        });
        mediaId = document.id;
        await redis.set(`file:${event.media.fileId}`, document.id);
      } else if (mediaId) {
        log.debug("Media already exists");
      }

      if (typeof event.entities == "object")
        event.entities = JSON.stringify(event.entities);

      const createdMessage = await xata.db.messages.createOrUpdate(event.id, {
        date: event.date,
        messageId: ensureString(event.messageId),
        messageText: toValidUTF8(event.messageText),
        fromUser: user?.id,
        toChat: chat?.id,
        media: mediaId,
        groupId: event.groupId,
        inReplyToId: event.inReplyToId,
        entities: event.entities,
      });

      // await pusher.trigger("chats", "new_message", {
      //   chatId: event?.fromChatFull?.id,
      //   messageId: event.messageId,
      //   messageText: toValidUTF8(event.messageText),
      //   fromUser: event.fromUserFull,
      //   toChat: event.fromChatFull,
      //   media: event.media,
      //   groupId: event.groupId,
      //   inReplyToId: event.inReplyToId,
      //   entities: event.entities,
      //   d
      // });

      log.info(`Created Message`);
    },
  });
};

run().catch((e) => console.error("[example/consumer] e.message", e));

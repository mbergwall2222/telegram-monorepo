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
import { chats, db, documents, messages, users } from "@telegram/db";
import { env } from "@telegram/env";

const consumer = kafka.consumer({ groupId: env.KAFKA_CONSUMER_GROUP_ID });

const run = async () => {
  // Connect the consumer
  await consumer.connect();
  await consumer.subscribe({
    topic: env.KAFKA_MESSAGES_TOPIC,
    fromBeginning: false,
  });

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

        const data = {
          userId: event.fromUserFull.id,
          firstName: toValidUTF8(event.fromUserFull.firstName),
          lastName: toValidUTF8(event.fromUserFull.lastName),
          username: event.fromUserFull.username,
          pfpUrl: event.fromUserFull.pfpUrl,
          description: event.fromUserFull.description
            ? toValidUTF8(event.fromUserFull.description)
            : undefined,
        };

        user = (
          await db
            .insert(users)
            .values(data)
            .onConflictDoUpdate({ target: users.userId, set: data })
            .returning()
        )[0];
        // await db.insert(users).values;
        // user = await db.users.createOrUpdate(event.fromUserFull.id, );

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
          const data = {
            telegramId: event.fromChatFull.id,
            isGroup: event.fromChatFull.isGroup,
            isChannel: event.fromChatFull.isChannel,
            title: toValidUTF8(event.fromChatFull.title),
            memberCount:
              event.fromChatFull.memberCount !== null
                ? `${event.fromChatFull.memberCount}`
                : undefined,
            pfpUrl: event.fromChatFull.pfpUrl,
            lastMessageDate: new Date(event.date),
            description: event.fromChatFull.description
              ? toValidUTF8(event.fromChatFull.description)
              : undefined,
          };

          chat = (
            await db
              .insert(chats)
              .values({ ...data })
              .onConflictDoUpdate({ target: chats.telegramId, set: data })
              .returning()
          )[0];

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

      // if (!chat)
      //   chat = event.fromChatFull?.id
      //     ? { id: event.fromChatFull?.id }
      //     : undefined;

      let mediaId;
      let document;
      if (event.media) {
        log.debug("Creating media");
        document = (
          await db
            .insert(documents)
            .values({
              fileId: event.media.fileId,
              fileName: event.media.fileName,
              fileSize: `${event.media.fileSize}`,
              mimeType: event.media.mimeType,
              fileUrl: event.media.fileUrl,
            })
            .returning()
        )[0];

        mediaId = document.id;
        await redis.set(`file:${event.media.fileId}`, document.id);
      } else if (mediaId) {
        log.debug("Media already exists");
      }

      if (typeof event.entities == "object")
        event.entities = JSON.stringify(event.entities);

      const createdMessage = await db
        .insert(messages)
        .values({
          date: new Date(event.date),
          messageId: ensureString(event.messageId),
          messageText: toValidUTF8(event.messageText),
          userId: user?.id,
          chatId: chat?.id as string,
          documentId: mediaId,
          groupId: event.groupId,
          inReplyToId: event.inReplyToId,
          entities: event.entities,
        })
        .onConflictDoNothing();

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

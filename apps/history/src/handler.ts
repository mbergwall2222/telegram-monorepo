import { env } from "@telegram/env";

import { TelegramClient, sessions, events, utils, Api } from "@telegram/gramjs";

//@ts-ignore
import input from "input";
import bigInt from "big-integer";
import { customAlphabet } from "nanoid";
import { handleMessage } from "./handleMessage";
import { logger } from "@telegram/logger";
import { kafka } from "@telegram/kafka";
import PromClient from "prom-client";
import { redis } from "@telegram/redis";
import { iterMessages } from "./messagesClass";
import { TakeoutClient } from "./TakeoutClient";
import cliProgress from "cli-progress";
import { Semaphore } from "async-mutex";
import { chats, db, eq } from "@telegram/db";
import { Queue, Worker } from "bullmq";

const counter = new PromClient.Counter({
  name: "history_messages_processed_total",
  help: "Total number of messages processed",
});

export const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
);

const prefixes = {
  img: "img",
  doc: "doc",
} as const;

export function uuid(prefix: keyof typeof prefixes): string {
  return [prefixes[prefix], nanoid(16)].join("_");
}

const sessionToQueuePrefix: Record<string, string> = {
  "history-0": "",
  "history-1": "",
  "history-2": "-2",
  "history-3": "-2",
};

// const session = new MemorySession();

const queue = new Queue(
  `{history-messages${sessionToQueuePrefix[env.SESSION]}}`,
  {
    connection: {
      host: env.REDIS_URL.split(":")[1].replace("//", ""),
    },
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
    },
  }
);

const semaphore = new Semaphore(50);

// console.log(await redis.info());
export function convertToJSON(obj: any) {
  const result: any = {};

  const validKeys = ["_sender", "_chat", "_inputChat", "_inputSender"];
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (
        key == "originalArgs" ||
        key == "action" ||
        (key[0] == "_" && !validKeys.includes(key))
      )
        continue;

      if (value instanceof bigInt) {
        result[key] = `B|${value.toString()}`;
      } else if (Array.isArray(value) || value instanceof Buffer) {
        result[key] = value.map(convertToJSON);
      } else if (typeof value === "object" && value !== null) {
        // Recursively handle ne sted objects
        result[key] = convertToJSON(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

export const main = async (client: TakeoutClient) => {
  logger.debug("Starting Telegram Client");

  // const takeout = await client.invoke(
  //   new Api.account.InitTakeoutSession({
  //     contacts: true,
  //     messageUsers: true,
  //     messageChats: true,
  //     messageMegagroups: true,
  //     messageChannels: true,
  //     files: true,
  //     fileMaxSize: bigInt(999999),
  //   })
  // );

  // console.log(takeout.id.toString());
  // return;

  // const dialogs = await client.getDialogs();

  // for(const dialog of dialogs) {
  //  semaphore.runExclusive(async () => {
  //   const message = await client.getMessages(dialog.inputEntity, { limit: 1 });
  //   const update = await handleMessage(client, message[0], {
  //     ignoreMedia: false,
  //     ignorePfp: false,
  //   });
  //   await queue.add("update", {...update as any, session: "worker-0"});
  //  })
  // }

  logger.debug("Telegram Client Started");

  const worker = new Worker(
    `{history-queue${sessionToQueuePrefix[env.SESSION]}}`,
    async (job) => {
      if (!client.connected) await client.connect();
      const data = job.data as { chatId: string };
      const dialogs = await client.getDialogs();

      const chat = dialogs.find((o) =>
        // @ts-ignore
        o?.entity?.id.toString()?.includes(data.chatId)
      );

      const get = (key: string) => {
        return redis.get(`history:chat:${chat?.id?.toString()}:${key}`);
      };

      const set = (key: string, value: any) => {
        return redis.set(`history:chat:${chat?.id?.toString()}:${key}`, value);
      };

      // console.log(chat);

      const currentMessageIdStr = await get("currentMessageId");
      let currentMessageId = currentMessageIdStr
        ? parseInt(currentMessageIdStr)
        : 0;

      const promiseCompletion = new Map();

      let updatedCurrentMessageId = currentMessageId;

      let totalMessagesInChatStr = await get("totalMessages");
      let totalMessagesInChat: number;
      if (!totalMessagesInChatStr) {
        totalMessagesInChat =
          (await client.getMessages(chat?.inputEntity, { limit: 1 }))[0].id ??
          0;
      } else {
        totalMessagesInChat = parseInt(totalMessagesInChatStr);
      }

      let totalMessagesDoneStr = await get("totalMessagesDone");
      let totalMessagesDone: number;
      totalMessagesDone = totalMessagesDoneStr
        ? parseInt(totalMessagesDoneStr)
        : 0;

      await set("totalMessages", totalMessagesInChat);

      const bar1 = new cliProgress.SingleBar(
        { etaBuffer: 5000 },
        cliProgress.Presets.shades_classic
      );
      bar1.start(totalMessagesInChat, currentMessageId);

      let totalJobs = totalMessagesDone;

      console.log("Starting", currentMessageId);
      let messages: { message: Api.Message; id: number }[] = [];

      const handleMessages = async () => {
        await queue.addBulk(
          messages.map((message) => ({
            name: message.message.id.toString(),
            data: convertToJSON(message.message),
            opts: {
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
              removeOnComplete: true,
            },
          }))
        );
        messages = [];
      };
      for await (const message of iterMessages(client, chat?.inputEntity, {
        reverse: true,
        offsetId: currentMessageId !== 0 ? currentMessageId : undefined,
        waitTime: 0,
      })) {
        let currentJob = currentMessageId + totalJobs;
        totalJobs++;

        messages.push({ message, id: currentJob });

        if (messages.length > 500) {
          await handleMessages();
          await set("currentMessageId", Math.max(...messages.map((o) => o.id)));
          bar1.update(totalJobs);
          await set("totalMessagesDone", totalJobs);
          await job.updateProgress(
            Math.floor((totalJobs / totalMessagesInChat) * 100)
          );
        }
      }

      console.log("DONE!");
      await db
        .update(chats)
        .set({ exportedInFull: true })
        .where(eq(chats.telegramId, data.chatId));

      await handleMessages();
      await client.sendMessage("me", { message: "Hello!" });
      logger.debug("Sent Hello! to self successfully");
    },
    {
      connection: {
        host: env.REDIS_URL.split(":")[1].replace("//", ""),
      },
      concurrency: 1,
    }
  );
};

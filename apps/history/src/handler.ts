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
import { Elysia } from "elysia";
import { redis } from "@telegram/redis";
import { iterMessages } from "./messagesClass";
import { TakeoutClient } from "./TakeoutClient";
import cliProgress from "cli-progress";
import { Semaphore } from "async-mutex";
import EventEmitter from "events";

const counter = new PromClient.Counter({
  name: "history_messages_processed_total",
  help: "Total number of messages processed",
});

new Elysia()
  .get("/metrics", ({ set }) => {
    set.headers["Content-Type"] = PromClient.register.contentType;
    return PromClient.register.metrics();
  })
  .listen(9090);
const { StoreSession, StringSession, MemorySession, RedisSession } = sessions;

const { getPeer, getPeerId } = utils;

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

const producer = kafka.producer();
// await producer.connect();
const apiId = env.TELEGRAM_API_ID;
const apiHash = env.TELEGRAM_APP_HASH;
// const session = new StoreSession(Bun.env.SESSION as string);
const session = new RedisSession(env.SESSION);
// const session = new MemorySession();

await session.load();

const semaphore = new Semaphore(25);

// console.log(await redis.info());
export function convertToJSON(obj: any) {
  const result: any = {};

  const validKeys = ["_sender", "_chat", "_inputChat", "_inputSender"];
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (key == "originalArgs" || (key[0] == "_" && !validKeys.includes(key)))
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

const topic = env.KAFKA_MESSAGES_TOPIC.split(",")[0];
function timeout(ms: number) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );
}

// Retry function
function retryPromise<T>(
  promiseFunc: () => Promise<T>,
  retries: number,
  ms: number
) {
  return new Promise((resolve, reject) => {
    promiseFunc()
      .then(resolve)
      .catch((error) => {
        if (retries === 0) {
          reject(error);
        } else {
          console.log(`Retrying... (${retries} attempts left)`);
          setTimeout(() => {
            retryPromise(promiseFunc, retries - 1, ms)
              .then(resolve)
              .catch(reject);
          }, ms);
        }
      });
  });
}
let oldClient: TakeoutClient;

// const message: SerializedMessage = {} as any;

// // @ts-ignore
// const testMessage = new Api.Message({});
// testMessage.peerId;
// // @ts-ignore
// if (message.peerId.className == "PeerChannel") {
//   message.peerId.getBytes
// }

export const main = async () => {
  logger.debug("Starting Telegram Client");
  if (oldClient) {
    await oldClient.disconnect();
  }
  const client = new TakeoutClient(
    bigInt("3131715400446398391"),
    session,
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  oldClient = client;

  console.log("Connecting");
  // await producer.connect();
  console.log("Connected");
  // client.setLogLevel(LogLevel.DEBUG);

  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
    firstAndLastNames: async () => {
      console.log("firstAndLastNames");
      const ev: any = "";
      return ev;
    },
    qrCode: async () => {
      console.log("qrCode");
      const ev: any = "";
      return ev;
    },
  });

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

  logger.debug("Telegram Client Started");

  const dialogs = await client.getDialogs();

  const chat = dialogs.find((o) =>
    // @ts-ignore
    o?.entity?.id.toString()?.includes("1379671793")
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

  let totalMessagesInChatStr = await get("totalMessages");
  let totalMessagesInChat: number;
  if (!totalMessagesInChatStr) {
    totalMessagesInChat =
      (await client.getMessages(chat?.inputEntity, { limit: 1 })).total ?? 0;
  } else {
    totalMessagesInChat = parseInt(totalMessagesInChatStr);
  }

  await set("totalMessages", totalMessagesInChat);

  const bar1 = new cliProgress.SingleBar(
    { etaBuffer: 5000 },
    cliProgress.Presets.shades_classic
  );
  bar1.start(totalMessagesInChat, currentMessageId);

  let totalJobs = 0;
  const promiseCompletion = new Map();

  function updateOffset() {
    let maxCompletedId = currentMessageId;
    for (let i = currentMessageId + 1; i <= maxCompletedId + 100; i++) {
      if (promiseCompletion.get(i)) {
        maxCompletedId = i;
      } else {
        break;
      }
    }

    if (maxCompletedId > currentMessageId) {
      for (let i = currentMessageId; i < maxCompletedId; i++) {
        promiseCompletion.delete(i);
      }
    }
    currentMessageId = maxCompletedId;
  }

  for await (const message of iterMessages(client, chat?.inputEntity, {
    reverse: true,
    offsetId: currentMessageId !== 0 ? currentMessageId : undefined,
    waitTime: 2500,
  })) {
    const sender = await message.getSender();
    Bun.write("test.json", JSON.stringify(convertToJSON({ ...message })));
    break;
    totalJobs++;
    let jobNumber = totalJobs;
    semaphore.runExclusive(async () => {
      const newUpdateEvent = await handleMessage(client, message, {
        ignoreMedia: false,
        ignorePfp: true,
      });
      // console.log(currentMessageId, totalMessagesInChat);
      let options = {
        headers: { "Content-Type": "application/json" },
      };

      const res = await fetch(
        "http://100.98.165.5:8080/redpanda.api.console.v1alpha1.ConsoleService/PublishMessage",
        {
          ...options,
          method: "POST",
          body: JSON.stringify({
            topic: "messages",
            partitionId: -1,
            compression: "COMPRESSION_TYPE_UNCOMPRESSED",
            value: {
              encoding: "PAYLOAD_ENCODING_JSON",
              data: Buffer.from(JSON.stringify(newUpdateEvent)).toString(
                "base64"
              ),
            },
          }),
        }
      );

      if (process.send) {
        process.send({ progress: 1 }); // Send progress update to parent
      }
      promiseCompletion.set(currentMessageId + jobNumber, true);

      updateOffset();
      console.log(`Updated Offset: ${currentMessageId}`);
      console.log(
        `Map: ${JSON.stringify([...promiseCompletion.keys()].sort((a, b) => a - b))}`
      );
      bar1.update(currentMessageId);
      await set("currentMessageId", currentMessageId);
      return newUpdateEvent;
    });

    if (totalJobs % 5 === 0) {
      // break;
      // await Bun.sleep(2500);
      // console.log(totalJobs);
    }
  }

  await client.sendMessage("me", { message: "Hello!" });
  logger.debug("Sent Hello! to self successfully");
};

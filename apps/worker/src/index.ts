import { env } from "@telegram/env";

import { TelegramClient, sessions, events, utils } from "@telegram/gramjs";

//@ts-ignore
import input from "input";
import bigInt from "big-integer";
import { customAlphabet } from "nanoid";
import { handleMessage } from "./handleMessage";
import { logger } from "@telegram/logger";
import { kafka } from "@telegram/kafka";
import PromClient from "prom-client";
import { Elysia } from "elysia";
import { ConfigurationInput, Lightship, createLightship } from "lightship";
import { redis } from "@telegram/redis";

const counter = new PromClient.Counter({
  name: "worker_messages_processed_total",
  help: "Total number of messages processed",
});

const configuration: ConfigurationInput = {
  port: 9000,
  detectKubernetes: true,
};

const lightship: Lightship = await createLightship(configuration);

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

const apiId = env.TELEGRAM_API_ID;
const apiHash = env.TELEGRAM_APP_HASH;
// const session = new StoreSession(Bun.env.SESSION as string);
const session = new RedisSession(env.SESSION);
// const session = new MemorySession();

await session.load();

// console.log(await redis.info());
export function convertToJSON(obj: any) {
  const result: any = {};

  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (key == "originalArgs" || key[0] == "_") continue;

      if (value instanceof bigInt) {
        result[key] = value.toString();
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

const main = async () => {
  logger.debug("Starting Telegram Client");

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await producer.connect();

  // client.setLogLevel(LogLevel.DEBUG);

  client.addEventHandler(async (event) => {
    const chatId = getPeerId(event?.message?.peerId);
    const log = logger.child({
      messageId: event?.message?.id.toString(),
      chatId,
      chatName: getPeer(event?.message?.peerId)?.title,
    });

    log.debug("Received new message");

    const newUpdateEvent = await handleMessage(client, event.message, {
      ignoreMedia: false,
    });

    if (!newUpdateEvent || newUpdateEvent === true) {
      log.warn("Message was ignored");
      return;
    }

    log.debug("Producing message to Kafka");
    // const partitionNumber = stringToShardKey(chatId);
    // log.debug({ partitionNumber }, "Generated partition number");

    const output = await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify({ ...newUpdateEvent, session: env.SESSION }),
          // partition: partitionNumber,
        },
      ],
    });

    log.debug(
      { output, setMessageId: newUpdateEvent.id },
      "Produced message to Kafka"
    );
    counter.inc();
  }, new events.NewMessage({}));

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

  lightship.registerShutdownHandler(async () => {
    await client.disconnect();
    await producer.disconnect();
  });
  lightship.signalReady();

  logger.debug("Telegram Client Started");

  await client.sendMessage("me", { message: "Hello!" });
  logger.debug("Sent Hello! to self successfully");
};

try {
  await main();
} catch (e) {
  console.log(e);
  console.log("SHUTTING DOWN");
  lightship.shutdown();
}

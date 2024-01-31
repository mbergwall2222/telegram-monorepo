import { env } from "@telegram/env";

import { TelegramClient, sessions, events, utils } from "@telegram/gramjs";
import { text } from "@clack/prompts";

//@ts-ignore
import input from "input";
import bigInt from "big-integer";
import { customAlphabet } from "nanoid";
import { logger } from "@telegram/logger";
import { kafka } from "@telegram/kafka";
import PromClient from "prom-client";
import { Elysia } from "elysia";
import { ConfigurationInput, Lightship, createLightship } from "lightship";
import { redis } from "@telegram/redis";
const { StoreSession, StringSession, MemorySession, RedisSession } = sessions;

let sessionName = "staging";

const apiId = env.TELEGRAM_API_ID;
const apiHash = env.TELEGRAM_APP_HASH;
// const session = new StoreSession(Bun.env.SESSION as string);
console.log("sessionName", sessionName);
// const session = new RedisSession(sessionName);
const session = new MemorySession();

await session.load();

// console.log(await redis.info());

const main = async () => {
  logger.debug("Starting Telegram Client");

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  // client.setLogLevel(LogLevel.DEBUG);

  await client.start({
    phoneNumber: async () => {
      const meaning = await text({
        message: "What is your phone number",
        // placeholder: 'Not sure',
        // initialValue: '42',
        validate(value) {
          if (value.length === 0) return `Value is required!`;
        },
      });
      return meaning as string;
    },
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () => {
      const meaning = await text({
        message: "What is the code?",
        // placeholder: 'Not sure',
        // initialValue: '42',
        validate(value) {
          if (value.length === 0) return `Value is required!`;
        },
      });
      return meaning as string;
    },
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

  logger.debug("Telegram Client Started");

  await redis.set(
    `session:${sessionName}:authKey`,
    JSON.stringify(session.authKey?.getKey()?.toJSON())
  );
  await redis.set(`session:${sessionName}:dcId`, session.dcId);
  await redis.set(
    `session:${sessionName}:serverAddress`,
    session.serverAddress
  );
  await redis.set(`session:${sessionName}:port`, session.port);

  console.log("session saved");
};

try {
  await main();
} catch (e) {
  console.log(e);
  console.log("SHUTTING DOWN");
}

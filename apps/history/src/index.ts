import EventEmitter from "events";
import { main } from "./handler";
import { worker } from "./worker";
import { TelegramClient, sessions } from "@telegram/gramjs";
import { env } from "@telegram/env";
import { TakeoutClient } from "./TakeoutClient";
import bigInt from "big-integer";
import { LogLevel } from "@telegram/gramjs/dist/extensions/Logger";
import { redis } from "@telegram/redis";
import { Queue } from "bullmq";
// const queue = new Queue("{history-queue}", {
//   connection: {
//     host: env.REDIS_URL.split(":")[1].replace("//", ""),
//   },
// });
// await queue.add(
//   "Budget Bites",
//   { chatId: "1775019320" },
//   { attempts: 5, backoff: { type: "exponential", delay: 1000 } }
// );

const { StoreSession, StringSession, MemorySession, RedisSession } = sessions;
const session = new RedisSession(env.SESSION);

let takeoutSession = await redis.get(`session:${env.SESSION}:takeout`);

// const session = new MemorySession();

await session.load();
const apiId = env.TELEGRAM_API_ID;
const apiHash = env.TELEGRAM_APP_HASH;
const client = takeoutSession
  ? new TakeoutClient(bigInt(takeoutSession), session, apiId, apiHash, {
      connectionRetries: 5,
    })
  : new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

client.setLogLevel(LogLevel.WARN);
console.log("Starting client...");
await client.start({
  phoneNumber: async () => "",
  password: async () => "",
  phoneCode: async () => "",
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

try {
  console.log(`Using takeout: ${!!takeoutSession}`);
  worker(client as TakeoutClient);
  main(client as TakeoutClient);
} catch (e) {
  console.log(e);
  console.log("SHUTTING DOWN");
}

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
import { and, chats, db, eq, isNotNull } from "@telegram/db";
// const chatsToProcess = await db.query.chats.findMany({
//   where: and(
//     eq(chats.exportedInFull, false),
//     eq(chats.isChannel, true),
//     isNotNull(chats.session)
//     // eq(chats.telegramId, "1686152181")
//   ),
// });
// const queue1 = new Queue("{history-messages}", {
//   connection: {
//     host: env.REDIS_URL.split(":")[1].replace("//", ""),
//   },
// });
// await queue1.drain();
// throw new Error();
// const queue2 = new Queue("{history-queue-2}", {
//   connection: {
//     host: env.REDIS_URL.split(":")[1].replace("//", ""),
//   },
// });
// for (const chat of chatsToProcess) {
//   const queue = chat.session == "worker-0" ? queue1 : queue2;

//   await queue.add(
//     (chat.title as string) ?? "",
//     { chatId: chat.telegramId },
//     { attempts: 5, backoff: { type: "exponential", delay: 1000 } }
//   );
// }

// await queue1.add(
//   "AIO Crime",
//   { chatId: "1500949252" },
//   { attempts: 5, backoff: { type: "exponential", delay: 1000 } }
// );
// console.log("Done");
// throw new Error();

const { StoreSession, StringSession, MemorySession, RedisSession } = sessions;
const session = new RedisSession(env.SESSION);

let takeoutSession = await redis.get(`session:${env.SESSION}:takeout`);

// const session = new MemorySession();

await session.load();
const apiId = env.TELEGRAM_API_ID;
const apiHash = env.TELEGRAM_APP_HASH;
const client =
  takeoutSession != null
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

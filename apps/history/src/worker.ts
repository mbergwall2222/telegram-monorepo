import { env } from "@telegram/env";
import { Api, sessions } from "@telegram/gramjs";
import { Queue, Worker } from "bullmq";
import { TakeoutClient } from "./TakeoutClient";
import bigInt from "big-integer";
import { Serialized, convertToMessage } from "./utils";
import { handleMessage } from "./handleMessage";

const sessionToQueuePrefix: Record<string, string> = {
  "history-0": "",
  "history-1": "",
  "history-2": "-2",
  "history-3": "-2",
};

const sessionToWorkerSession: Record<string, string> = {
  "history-0": "worker-0",
  "history-1": "worker-0",
  "history-2": "worker-1",
  "history-3": "worker-1",
};

const resultsQueue = new Queue(
  `{history-results${sessionToQueuePrefix[env.SESSION]}}`,
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

export const worker = (client: TakeoutClient) => {
  const w = new Worker(
    `{history-messages${sessionToQueuePrefix[env.SESSION]}}`,
    async (job) => {
      if (!client.connected) await client.connect();
      const data = job.data as Serialized<Api.Message>;
      const message = await convertToMessage(data, client);
      const newUpdateEvent = await handleMessage(client, message, {
        ignoreMedia: false,
        ignorePfp: false,
      });

      if (typeof newUpdateEvent == "object") {
        await resultsQueue.add(newUpdateEvent.id, {
          ...newUpdateEvent,
          session: sessionToWorkerSession[env.SESSION],
        });
      }
    },
    {
      connection: {
        host: env.REDIS_URL.split(":")[1].replace("//", ""),
      },
      concurrency: 35,
    }
  );
};

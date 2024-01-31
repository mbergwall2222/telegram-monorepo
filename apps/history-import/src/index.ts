import { env } from "@telegram/env";
import { Worker } from "bullmq";
import { NewUpdateEvent } from "@telegram/types";
import { kafka } from "@telegram/kafka";

const producer = kafka.producer();
await producer.connect();

let isFlushing = false;
let updates: NewUpdateEvent[] = [];
let overflowQueue: NewUpdateEvent[] = [];

async function flushItems() {
  isFlushing = true;
  let itemsToFlush = updates;
  updates = [];

  try {
    console.log(`Flushing ${itemsToFlush.length} items to Kafka`);
    if (itemsToFlush.length)
      await producer.sendBatch({
        topicMessages: [
          {
            topic: env.KAFKA_MESSAGES_TOPIC.split(",")[0],
            messages: itemsToFlush.map((update) => ({
              value: JSON.stringify(update),
            })),
          },
        ],
      });
  } catch (error) {
    console.error("Failed to push to API", error);
    // Handle error appropriately
  } finally {
    isFlushing = false;
    if (overflowQueue.length > 0) {
      updates.push(...overflowQueue);
      overflowQueue = [];
      if (updates.length >= 1000) {
        await flushItems();
      }
    }
  }
}

const addItem = (data: NewUpdateEvent) => {
  if (isFlushing) {
    overflowQueue.push(data);
  } else {
    updates.push(data);
  }
};

setInterval(async () => {
  console.log("Flushing items");
  if (updates.length >= 1000) {
    await flushItems();
  }
}, 10000);

setInterval(async () => {
  console.log("Flushing all items");
  await flushItems();
}, 60000);

const worker = new Worker(
  "{history-results}",
  async (job) => {
    const data = job.data as NewUpdateEvent;
    addItem(data);
  },
  {
    connection: {
      host: env.REDIS_URL.split(":")[1].replace("//", ""),
    },
    concurrency: 100,
  }
);

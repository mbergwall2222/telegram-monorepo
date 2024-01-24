import {
  SchemaRegistry,
  avdlToAVSCAsync,
} from "@telegram/confluent-schema-registry";
import { kafka } from "@telegram/kafka";
import { Consumer, KafkaMessage } from "kafkajs";
import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";
import { CohereClient } from "cohere-ai";
import { env } from "@telegram/env";

const key = "Bl70tSVXSOY9kJqpZs5mRYN4AZHJ7kHao9lOBvF5";

const cohere = new CohereClient({
  token: key, // This is your trial API key
});

const getUuid = (str: string) => {
  const hash = crypto
    .createHash("sha1")
    .update(str)
    .digest("hex");
  return (
    hash.substring(0, 8) +
    hash.substring(8, 12) +
    "4" +
    hash.substring(13, 16) + // The '4' indicates a UUID version 4
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) +
    hash.substring(17, 20) +
    hash.substring(20, 32)
  );
};
const registry = new SchemaRegistry({
  host: "https://redpanda-external.redpanda.svc:8084",
  // agent: httpsAgent,
});

const client = new QdrantClient({ url: "http://qdrant.qdrant.svc:6333" });

const messageQueue: KafkaMessage[] = [];
const batchSize = 50;
let timer: Timer;

async function query(data: string[]) {
  const response = await cohere.embed({
    model: "embed-multilingual-v3.0",
    texts: data,
    inputType: "search_document",
  });
  return response.embeddings as number[][];
}

// const processBatch = async () => {
//   clearTimeout(timer);
//   const points: {
//     id: string;
//     vector: number[];
//     payload: {
//       document_id: any;
//       user_id: any;
//       chat_id: any;
//       created_at: any;
//       in_reply_to_id: any;
//       group_id: any;
//       message_id: any;
//       date: any;
//       id: any;
//     };
//   }[] = [];
//   const currBatch: KafkaMessage[] = [];
//   while (messageQueue.length > 0) {
//     const nextMessage = messageQueue.shift();
//     if (nextMessage) currBatch.push(nextMessage);
//   }

//   console.log("Processing batch of size", currBatch.length);

//   const results = await Promise.allSettled(
//     currBatch.map(async (message) => {
//       if (!message.value) return;
//       const decodedValue = await registry.decode(message.value);
//       if (!decodedValue?.message_text?.length) return;
//       const vector = await query(decodedValue.message_text);
//       const id = getUuid(decodedValue.id);
//       const {
//         document_id,
//         user_id,
//         chat_id,
//         created_at,
//         entities,
//         in_reply_to_id,
//         group_id,
//         message_id,
//         message_text,
//         date,
//         id: realId,
//       } = decodedValue;
//       return {
//         id,
//         vector,
//         payload: {
//           document_id,
//           user_id,
//           chat_id,
//           created_at,
//           in_reply_to_id,
//           group_id,
//           message_id,
//           message_text,
//           date,
//           id: realId,
//         },
//       };
//     })
//   );

//   results.forEach((res) => {
//     if (res.status === "fulfilled") {
//       if (res.value) points.push(res.value);
//     }
//   });

//   await client.upsert(env.QDRANT_COLLECTIONS_NAME, { wait: false, points });
// };

// If the batch size does not reach the expected size in 10s, will process the batch after 10s
// const scheduleBatchProcessing = () => {
//   clearTimeout(timer);
//   timer = setTimeout(processBatch, 10000); // 10 seconds
// };

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}
const consumer = kafka.consumer({
  groupId: `qdrant-${env.KAFKA_DATA_TOPIC}`,
});
let oldConsumer: Consumer;
const run = async () => {
  // return;
  // Connect the consumer

  // consumer.on("consumer.rebalancing", (e) => console.log("Rebalancing", e));
  // consumer.on("consumer.fetch", (e) => console.log("Fetching", e));
  // consumer.on("consumer.stop", (e) => console.log("Stopping", e));
  // consumer.on("consumer.connect", (e) => console.log("Starting", e));
  // consumer.on("consumer.crash", (e) => console.log("Crashing", e));
  // consumer.on("consumer.heartbeat", (e) => console.log("Heartbeat", e));
  // consumer.on("consumer.commit_offsets", (e) => console.log("Committing", e));
  // consumer.on("consumer.group_join", (e) => console.log("Group Join", e));
  // consumer.on("consumer.start_batch_process", (e) =>
  //   console.log("start batch", e)
  // );

  console.log("Connecting consumer");
  await consumer.connect();
  console.log("Connected consumer");
  await consumer.subscribe({
    topic: env.KAFKA_DATA_TOPIC,
    fromBeginning: true,
  });
  console.log("Subscribed consumer");

  await consumer.run({
    eachBatchAutoResolve: true,
    autoCommitInterval: 5000,
    // partitionsConsumedConcurrently: 100,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      uncommittedOffsets,
      isRunning,
      isStale,
      pause,
    }) => {
      console.log(`Received batch of size ${batch.messages.length}`);
      const messages = await Promise.all(
        batch.messages
          .filter((message) => message.value != null)
          .map(async (message) => ({
            offset: message.offset,
            value: await registry.decode(message.value as Buffer),
          }))
      );
      const chunkedMessages = chunkArray(
        messages.filter((message) => message.value.message_text.length),
        90
      );

      let totalMessagesSent = 0;
      let i = 0;

      const chunkedChunks = chunkArray(chunkedMessages, 10);

      for (const _chunk of chunkedChunks) {
        if (!isRunning() || isStale()) break;
        const pointsNested = await Promise.all(
          _chunk.map(async (chunk) => {
            if (!isRunning() || isStale()) return [];

            const chunkMessages = chunk.filter(
              (message) => message.value.message_text.length
            );
            if (!chunkMessages.length) return [];
            const vectors = await query(
              chunkMessages.map((message) => message.value.message_text)
            );
            const points = chunkMessages.map((_message, index) => {
              const message = _message.value;
              const id = getUuid(message.id);
              const {
                document_id,
                user_id,
                chat_id,
                created_at,
                entities,
                in_reply_to_id,
                group_id,
                message_id,
                message_text,
                date,
                id: realId,
              } = message;
              return {
                id,
                vector: vectors[index],
                payload: {
                  document_id,
                  user_id,
                  chat_id,
                  created_at,
                  in_reply_to_id,
                  group_id,
                  message_id,
                  message_text,
                  date,
                  id: realId,
                },
              };
            });

            totalMessagesSent += chunkMessages.length;
            console.log(`Prepared ${chunkMessages.length} messages to qdrant`);
            // await heartbeat();
            return points;
          })
        );

        const points = pointsNested.flat();

        if (points.length) {
          await client.upsert(env.QDRANT_COLLECTIONS_NAME, {
            wait: false,
            points,
          });
          console.log(`Sent ${points.length} messages to qdrant`);
        }

        console.log("isRunning", isRunning());
        console.log("isStale", isStale());

        const lastMessageChunk = _chunk[_chunk.length - 1];
        const lastMessage = lastMessageChunk[lastMessageChunk.length - 1];
        resolveOffset(lastMessage.offset);
        await commitOffsetsIfNecessary();

        try {
          await heartbeat();
        } catch (e) {
          console.log("err on heartbeat, rerunning");
          await consumer.joinAndSync();
        }
      }
    },
  });

  // await consumer.run({
  //   eachMessage: async ({ message }) => {
  //     try {
  //       messageQueue.push(message);
  //       if (messageQueue.length >= batchSize) {
  //         await processBatch();
  //       } else {
  //         scheduleBatchProcessing();
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   },
  // });
};
run();

import {
  SchemaRegistry,
  avdlToAVSCAsync,
} from "@telegram/confluent-schema-registry";
import { kafka } from "@telegram/kafka";
import { KafkaMessage } from "kafkajs";
import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";
import { CohereClient } from "cohere-ai";
import { env } from "@telegram/env";

const key = "Bl70tSVXSOY9kJqpZs5mRYN4AZHJ7kHao9lOBvF5";

const cohere = new CohereClient({
  token: key, // This is your trial API key
});

const getUuid = (str: string) => {
  const hash = crypto.createHash("sha1").update(str).digest("hex");
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

const consumer = kafka.consumer({ groupId: `qdrant-${env.KAFKA_DATA_TOPIC}` });

const run = async () => {
  // return;
  // Connect the consumer
  console.log("Connecting consumer")
  await consumer.connect();
  console.log("Connected consumer")
  await consumer.subscribe({
    topic: env.KAFKA_DATA_TOPIC,
    fromBeginning: true,
  });
  console.log("Subscribed consumer")

  await consumer.run({eachBatchAutoResolve: true,
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
      const messages = await Promise.all(batch.messages.filter(message => message.value != null).map(message => registry.decode(message.value as Buffer)));
      const chunkedMessages = chunkArray(messages, 50);

      let totalMessagesSent = 0;

      let i = 0;
      for(const chunk of chunkedMessages) {
        console.log(`Chunk ${++i} of ${chunkedMessages.length}`);
        const chunkMessages = chunk.filter(message => message.message_text?.length);

        const vectors = await query(chunkMessages.map(message => message.message_text));
        const points = chunkMessages.map((message, index) => {
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
        
        await client.upsert(env.QDRANT_COLLECTIONS_NAME, { wait: false, points });
        totalMessagesSent += chunkMessages.length;
        console.log(`Sent ${chunkMessages.length} messages to qdrant`);
        await heartbeat();
      }
     
    }});

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

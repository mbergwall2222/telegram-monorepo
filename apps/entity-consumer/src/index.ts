import { WordTokenizer } from "natural";
import { removeStopwords } from "stopword"; // Import stopwords
import { Semaphore } from "async-mutex";
import { kafka } from "@telegram/kafka";
import { logger } from "@telegram/logger";
import { getXataClient } from "@telegram/xata";
import { NewUpdateEvent } from "@telegram/types";
import { hash } from "@telegram/utils";

function extractEntities(text: string): string[] {
  // Improved regular expression for URL detection
  const urlRegex =
    /((?:https?:\/\/)?(?:www\.)?[^.\s\/]+(?:\.[^.\s\/]+)+(?:\/[^\s]*)?)/g;

  let match;
  const tokenizer = new WordTokenizer();
  const urlMap = new Map();

  const urls =
    text
      .match(urlRegex)
      ?.map((url) =>
        url.replace(/https?:\/\/|www\./g, "").replace(/\/$/, "")
      ) || [];
  text = text.replaceAll(urlRegex, "");

  // Tokenize the remaining text
  let tokens = tokenizer.tokenize(text);
  if (!tokens) tokens = [];

  const tokensWithoutStopwords = removeStopwords(tokens);

  // Replace placeholders with actual URLs
  return [...tokensWithoutStopwords, ...urls].map((o) => o.toLowerCase());
}

const semaphore = new Semaphore(1);

const consumer = kafka.consumer({ groupId: "entity-worker" });

const xata = getXataClient();
let i = 0;
const run = async () => {
  // Connect the consumer
  await consumer.connect();
  await consumer.subscribe({ topic: "messages", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(
        message.value?.toString() || "{}"
      ) as NewUpdateEvent;
      const log = logger.child({ logId: event.id, service: "entity-worker" });

      if (!event.date || !event.messageText) return;

      const entities = extractEntities(event.messageText as string);

      if (!entities.length) return;

      const newRecords = entities.map((entity) => ({
        messageId: event.id,
        chatId: event.fromChatFull?.id,
        userId: event.fromUserFull?.id,
        date: event.date,
        entity,
      }));

      try {
        await xata.db.messageEntities.create(
          newRecords.map((record) => ({ ...record, id: `${hash(record)}` }))
        );
        log.info("Created message entity.");
      } catch (e) {
        // log.error({ e }, "Error creating message entities");
      }
    },
    partitionsConsumedConcurrently: 10,
  });
};

run().catch((e) => console.error("[example/entityConsumer] e.message", e));

import { NewUpdateEvent } from "@telegram/types";
import results from "./result.json";
import { kafka } from "@telegram/kafka";
import { env } from "@telegram/env";

const newMessages: NewUpdateEvent[] = [];

const producer = kafka.producer();
console.log("Connecting to kafka");
await producer.connect();

console.log("Connected to kafka");

const _results = results as any;

const chatId = `${_results.id}`;
const chat: NewUpdateEvent["fromChatFull"] = {
  id: chatId,
  isGroup: true,
  isChannel: true,
  title: _results.name,
  // pfpUrl: null,

};

_results.messages.slice(0,1).forEach((result: any) => {
  if(result.type != "message") return;
  let text;

  if(typeof result.text == "string") text = result.text;
  else text = result.text.map((t: any) => {
    if(typeof t == "string") return t;
    else return t.text;
  }).join("");

  const date = new Date(result.date);
  date.setHours(date.getHours() + 5);


  const newMessage: NewUpdateEvent = {
    id: `${result.id}`,
    date: date.toISOString(),
    messageId: `${result.id}`,
    messageText: text,
    fromUser: result.from_id.replace("user", ""),
    toChat: chatId,
    fromUserFull: !!result.from_id ? {
      id: result.from_id?.replace("user", ""),
      firstName: result?.from ? result?.from : undefined

    } : undefined,
    fromChatFull: chat,
    inReplyToId: result.reply_to_message_id ? `${result.reply_to_message_id}` : undefined,
    // entities: result.entities,
  }

  newMessages.push(newMessage);
});

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      result.push(chunk);
  }
  return result;
}

const chunkedMessages = chunkArray(newMessages, 1000);

let totalMessagesSent = 0;
let i =0;
for(const chunk of chunkedMessages) {
  console.log(`Chunk ${++i} of ${chunkedMessages.length} `)
  console.log(`Sending ${chunk.length} messages to kafka`);
const output = await producer.send({
  topic: env.KAFKA_MESSAGES_TOPIC,
  messages: chunk.map(o => ({value: JSON.stringify(o)}))
});

totalMessagesSent += chunk.length

console.log(`Sent messages to kafka; totalMessagesSent: ${totalMessagesSent}`);
}


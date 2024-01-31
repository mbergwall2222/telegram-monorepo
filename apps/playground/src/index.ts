import { env } from "@telegram/env";
const sempahore = new Semaphore(25);

import { Api, TelegramClient, sessions, bigInt } from "@telegram/gramjs";
// import { iterMessages } from "./messagesClass";
import { handleMessage } from "./handleMessage";
import { kafka } from "@telegram/kafka";
import { Semaphore } from "async-mutex";

// const elasticClient = new Client({
//   node: env.ELASTICSEARCH_URL,
//   auth: {
//     apiKey: env.ELASTICSEARCH_API_KEY,
//   },
//   tls: { rejectUnauthorized: false },
// });

console.log("hi");
const session = new sessions.StoreSession("mainnew3");
const apiId = 24600817;
const apiHash = "78fe78114f5bc72f27769d78bb0c0574";

const client = new TelegramClient(
  // bigInt("4124955603282400371"),
  session,
  apiId,
  apiHash,
  {
    connectionRetries: 5,
  }
);

// client.setLogLevel(LogLevel.DEBUG);
console.log("HERE");

await client.start({
  phoneNumber: async () => "+12039190591", //await input.text("Please enter your number: "),
  password: async () => "0",
  phoneCode: async () => "15572",
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
console.log("Done");
const producer = kafka.producer();
await producer.connect();
console.log("Connected");
// console.log(env);
// const topic = env.KAFKA_MESSAGES_TOPIC.split(",")[0];
let messageId: any;
let messagesHandled = 0;
while (true && messageId != -1) {
  const messages = await client.getMessages(undefined, {
    limit: 2000,
    search: "ifruit",
    waitTime: 0,
  });
  // console.log(messages);
  messageId = -1;

  let i = 0;
  await Promise.all(
    messages.map((message) =>
      (async () => {
        if (message.className !== "Message") return;
        // const m = new Api.Message({
        //   ...message
        // })
        sempahore.runExclusive(async () => {
          const newUpdate = await handleMessage(client, message, {
            ignoreMedia: false,
          });
          const output = await producer.send({
            topic: "messages",
            messages: [
              {
                value: JSON.stringify(newUpdate),
                // partition: partitionNumber,
              },
            ],
          });
          console.log(`${++i} / ${messages.length}`);
        });
        // console.log(newUpdate);
        // console.log(newUpdate);
      })()
    )
  );
  console.log("Done!");
}

// console.log(messages);
// const producer = kafka.producer();
// await producer.connect();

// (async () => {
//   await client.start({
//     phoneNumber: async () => "+12039190591", //await input.text("Please enter your number: "),
//     password: async () => "0",
//     phoneCode: async () => "15572",
//     onError: (err) => console.log(err),
//     firstAndLastNames: async () => {
//       console.log("firstAndLastNames");
//       const ev: any = "";
//       return ev;
//     },
//     qrCode: async () => {
//       console.log("qrCode");
//       const ev: any = "";
//       return ev;
//     },
//   });

//   // const takeout = await client.invoke(
//   //   new Api.account.InitTakeoutSession({
//   //     messageUsers: true,
//   //     contacts: true,
//   //     messageChats: true,
//   //     messageMegagroups: true,
//   //     messageChannels: true,
//   //     files: true,
//   //     fileMaxSize: bigInt(999999),
//   //   })
//   // );
//   const producer = kafka.producer();
//   await producer.connect();
//   const topic = env.KAFKA_MESSAGES_TOPIC.split(",")[0];

//   // console.log(takeout.id.toString());
//   // return;
//   // for await (const message of iterMessages(client, undefined, {
//   //   search: "haku",
//   //   // waitTime: 40,
//   //   // limit: 2999,
//   // })) {
//   //   const newUpdate = await handleMessage(client, message, {
//   //     ignoreMedia: false,
//   //   });
//   //   const output = await producer.send({
//   //     topic,
//   //     messages: [
//   //       {
//   //         value: JSON.stringify(newUpdate),
//   //         // partition: partitionNumber,
//   //       },
//   //     ],
//   //   });
//   //   console.log(newUpdate);
//   // }
//   // const messages = await client.invoke(
//   //   new Api.messages.SearchGlobal({
//   //     q: "haku",
//   //     filter: new Api.InputMessagesFilterEmpty(),
//   //     limit: 10,
//   //     // offsetId: 342,
//   //     offsetPeer: new Api.InputPeerEmpty(),
//   //   })
//   // );
//   // console.log(messages);
//   // const dialogs = await client.getDialogs();
//   // const entities = dialogs.filter((o) => o.isChannel);
//   // const dialog = dialogs.find((o) => o?.entity?.title?.includes("AIO"));
//   // if (!dialog) return;
//   // let messagesCount = 0;
//   // let messageId = 0;

//   let messageId = 0;
//   while (true) {
//     const messages = await client.getMessages(undefined, {
//       limit: 10,
//       search: "haku",
//       offsetId: messageId,
//       waitTime: 0,
//     });
//     let amountLeft = messages.length;

//     console.log("Handling message");
//     await Promise.all(
//       messages.map((message) =>
//         (async () => {
//           // const m = new Api.Message({
//           //   ...message
//           // })
//           const newUpdate = await handleMessage(client, message, {
//             ignoreMedia: false,
//           });
//           // const output = await producer.send({
//           //   topic,
//           //   messages: [
//           //     {
//           //       value: JSON.stringify(newUpdate),
//           //       // partition: partitionNumber,
//           //     },
//           //   ],
//           // });
//           console.log(newUpdate);
//           // console.log(newUpdate);
//         })()
//       )
//     );
//     console.log("Done!");
//   }
//   // for await (const message of iterMessages(client, dialog.inputEntity, {
//   //   reverse: true,
//   // })) {
//   //   messagesCount++;
//   //   if (messagesCount % 100 === 0) console.log(messagesCount);
//   // }
// })();

// const renameKeys = async () => {
//   console.log(await redis.info());
//   // let count = 0;
//   let cursor = 0;

//   do {
//     // Scan the keys
//     const reply = await redis.scan(cursor, {
//       MATCH: "session:main:*",
//       COUNT: 100,
//     });
//     console.log(reply.cursor, reply.keys.length);
//     cursor = reply.cursor;
//     const keys = reply.keys;

//     let multi = redis.multi();
//     // Rename each key
//     for (const key of keys) {
//       const newKey = key.replace("session:main:", "session:worker-0:");
//       multi.rename(key, newKey);
//     }
//     await multi.exec();
//   } while (cursor !== 0);
// };
// console.log(await redis.scan(cursor, { MATCH: "session:main:*", COUNT: 10 }));

// const syncWorkspaces = async () => {
//   const linkedMessages = await db.query.workspacesToMessages.findMany({});

//   console.log(`Found ${linkedMessages.length} linked messages.`);
//   for (const message of linkedMessages) {
//     await db
//       .update(messages)
//       .set({
//         workspaceIds: sql`array_append(${messages.workspaceIds}, ${message.workspaceId})`,
//       })
//       .where(eq(messages.id, message.messageId));
//   }

//   const linkedUsers = await db.query.workspacesToUsers.findMany({});
//   console.log(`Found ${linkedUsers.length} linked users.`);

//   for (const user of linkedUsers) {
//     await db
//       .update(users)
//       .set({
//         workspaceIds: sql`array_append(${users.workspaceIds}, ${user.workspaceId})`,
//       })
//       .where(eq(users.id, user.userId));
//   }

//   const linkedChats = await db.query.workspacesToChats.findMany({});
//   console.log(`Found ${linkedChats.length} linked chats.`);
//   for (const chat of linkedChats) {
//     await db
//       .update(chats)
//       .set({
//         workspaceIds: sql`array_append(${chats.workspaceIds}, ${chat.workspaceId})`,
//       })
//       .where(eq(chats.id, chat.chatId));
//   }
// };

// const getChatAge = async () => {
//   const messagesQuery = db
//     .select({
//       rn: sql`ROW_NUMBER() OVER(PARTITION BY "chat_id" ORDER BY "date" ASC)`.as(
//         "rn"
//       ),
//       chatId: messages.chatId,
//       date: messages.date,
//     })
//     .from(messages)
//     .orderBy(asc(messages.date))
//     .as("chatMessages");

//   const data = await db
//     .select({
//       title: chats.title,
//       oldestMessage: sql`CURRENT_DATE - ${messagesQuery.date}`.as(
//         "oldestMessage"
//       ),
//       count: count(messagesQuery.date),
//     })
//     .from(chats)
//     .innerJoin(messagesQuery, eq(messagesQuery.chatId, chats.id))
//     .where(
//       and(
//         eq(messagesQuery.rn, 1),
//         // gte(messagesQuery.date, sql`CURRENT_DATE - INTERVAL '30 days'`),
//         or(eq(chats.isGroup, true), eq(chats.isChannel, true))
//       )
//     )
//     .groupBy(chats.title, messagesQuery.date);
//   // .execute();

//   console.log(data);
//   // await db.update(chats).set({exportedInFull: false}).where(inArray(chats.id, data.map(o => o.chats.id)));
// };

// const getLinks = async () => {
//   const pit = await elasticClient.openPointInTime({
//     index: "data.telegram.messages",
//     keep_alive: "10s",
//   });

//   let pitId = pit.id;
//   let hasMore = true;

//   let totalMessages = 0;

//   let uniqueMatches = new Set();
//   const terms: Record<string, Set<string>> = {};
//   const dates: Record<string, number> = {};
//   let searchAfter: SortResults | undefined;

//   while (hasMore) {
//     const data = await elasticClient.search<{
//       message_text: string;
//       date: number;
//     }>({
//       size: 1000,
//       query: {
//         bool: {
//           must: [
//             {
//               match: {
//                 message_text: {
//                   query: "t.me",
//                   minimum_should_match: 1,
//                 },
//               },
//             },
//             {
//               match: {
//                 message_text: {
//                   query:
//                     "logs ftid scans refund refunds flights food doordash uber CPN CPNS fullz meal bin CC CCs RDP airbnb rental",
//                   boost: 20,
//                 },
//               },
//             },
//           ],
//         },
//       },
//       pit: {
//         id: pitId,
//         keep_alive: "10s",
//       },
//       sort: [{ date: "desc" }, { "id.keyword": "desc" }],
//       search_after: searchAfter,
//       highlight: {
//         fields: {
//           message_text: {},
//         },
//         pre_tags: ["<em>"],
//         post_tags: ["</em>"],
//       },
//     });

//     hasMore = data.hits.hits.length > 0;
//     if (!hasMore) break;

//     totalMessages += data.hits.hits.length;
//     console.log(
//       `Found ${totalMessages} messages. - Most Recent Date ${new Date(data.hits.hits[0]?._source?.date as number).toISOString()}`
//     );

//     pitId = data.pit_id as string;
//     searchAfter = data.hits.hits[data.hits.hits.length - 1].sort as SortResults;

//     const regex = /(?:t|telegram)\.(?:me|dog)\/(joinchat\/|\+)?([\w-]+)/g;
//     const highlightRegex = /<em>(.*?)<\/em>/g;

//     const extractMatchedTerms = (highlightSnippets: string[]) => {
//       const allMatches: string[] = [];

//       highlightSnippets.forEach((snippet) => {
//         let match;
//         while ((match = highlightRegex.exec(snippet)) !== null) {
//           if (match[1] == "t.me") continue;
//           allMatches.push(match[1]);
//         }
//       });

//       // Return unique terms
//       return [...new Set(allMatches)];
//     };

//     let match;

//     for (const o of data.hits.hits) {
//       const text = o._source?.message_text;
//       const highlights = o.highlight || {};
//       let matchedTerms: string[] = [];

//       if (highlights.message_text) {
//         matchedTerms = extractMatchedTerms(highlights.message_text);
//       }
//       while ((match = regex.exec(text as string)) !== null) {
//         // This is necessary to avoid infinite loops with zero-width matches
//         if (match.index === regex.lastIndex) {
//           regex.lastIndex++;
//         }

//         const link = match[0] as string;
//         if (!terms[link])
//           terms[link] = new Set(matchedTerms.map((o) => o.toLowerCase()));
//         else matchedTerms.forEach((o) => terms[link].add(o.toLowerCase()));

//         if (!dates[link]) dates[link] = o._source?.date as number;
//         else dates[link] = Math.max(dates[link], o._source?.date as number);
//         // Add the match to the matches array
//         uniqueMatches.add(match[0]); // Use match[1], match[2], etc., for specific groups
//       }
//     }

//     console.log(`Total Links: ${uniqueMatches.size}`);
//     const allLinks = Array.from(uniqueMatches) as string[];
//     writeFileSync(
//       "links.json",
//       JSON.stringify(
//         allLinks.map((link) => ({
//           link: `https://${link}`,
//           terms: Array.from(terms[link]),
//           date: new Date(dates[link]).toISOString(),
//         }))
//       ),
//       "utf-8"
//     );
//   }
// };

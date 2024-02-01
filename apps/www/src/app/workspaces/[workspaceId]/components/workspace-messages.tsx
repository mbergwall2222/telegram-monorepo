import { ScrollArea } from "@/components/ui/scroll-area";
import {
  and,
  chats,
  db,
  desc,
  documents,
  eq,
  inArray,
  isNotNull,
  messages,
  users,
  workspacesToMessages,
} from "@telegram/db";
import { Message } from "./message";
import Link from "next/link";
import { elasticClient } from "@/lib/server/elastic";
import { env } from "@/env.mjs";
import { IMessage } from "@/lib/types/messages";
import LoadMore from "./load-more";

const PAGE_SIZE = 5;

type GetMessagesParams = {
  query?: string;
  offset: number | null;
  workspaceId: string;
};
const getMessages = async ({
  query,
  offset,
  workspaceId,
}: GetMessagesParams) => {
  if (offset == null) return [];

  let messagesData: Awaited<
    ReturnType<
      typeof db.query.workspacesToMessages.findMany<{
        with: {
          message: {
            with: {
              chat: true;
              user: true;
              document: true;
            };
          };
        };
      }>
    >
  >;

  if (!query) {
    const newMessagesData = await db
      .select()
      .from(workspacesToMessages)
      .innerJoin(messages, eq(workspacesToMessages.messageId, messages.id))
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(documents, eq(messages.documentId, documents.id))
      .where(eq(workspacesToMessages.workspaceId, workspaceId))
      .orderBy(desc(messages.date))
      .offset(offset)
      .limit(PAGE_SIZE);

    messagesData = newMessagesData.map((message) => ({
      workspaceId: message.workspaces_to_messages.workspaceId,
      id: message.workspaces_to_messages.id,
      messageId: message.workspaces_to_messages.messageId,
      message: {
        ...message.messages,
        chat: message.chats,
        document: message.documents,
        user: message.users,
      },
    }));
  } else {
    const matchedMessages = await elasticClient.search<IMessage>({
      index: `${env.ELASTICSEARCH_PREFIX}.telegram.messages`,
      query: {
        bool: {
          should: query
            .split(" ")
            .map((q) => [
              {
                wildcard: {
                  message_text: {
                    value: `*${q}*`,
                  },
                },
              },
            ])
            .flat(),
          minimum_should_match: 1,
          filter: {
            term: { workspace_ids: workspaceId },
          },
        },
      },
      size: PAGE_SIZE,
      from: offset,
    });

    console.log(
      `Matched ${matchedMessages.hits.hits.length} messages - Took ${matchedMessages.took}ms`
    );

    const ids = matchedMessages.hits.hits.map((hit) => hit._id);

    if (!ids.length) messagesData = [];
    else {
      messagesData = await db.query.workspacesToMessages.findMany({
        where: and(
          eq(workspacesToMessages.workspaceId, workspaceId),
          inArray(workspacesToMessages.messageId, ids)
        ),
        with: {
          message: {
            with: {
              chat: true,
              user: true,
              document: true,
            },
          },
        },
      });
      messagesData = ids.map(
        (id) =>
          messagesData.find(
            (message) => message.message.id == id
          ) as (typeof messagesData)[number]
      );
    }
  }

  return messagesData;
};

async function loadMoreMessages(data: GetMessagesParams) {
  "use server";

  if (data.offset == null) return [, null];
  const messagesData = await getMessages(data);

  const nextOffset =
    messagesData.length >= PAGE_SIZE ? data.offset + PAGE_SIZE : null;
  console.log("oldData", data);
  data.offset = nextOffset;
  console.log("newData", data);
  return [
    <>
      {messagesData.map((message) => (
        <Message key={message.message.id} message={message.message} />
      ))}
    </>,
    data,
  ] as const;
}
export const WorkspaceMessages = async ({
  workspaceId,
  query,
}: {
  workspaceId: string;
  query?: string;
}) => {
  const messagesData = await getMessages({ query, workspaceId, offset: 0 });

  return messagesData.length ? (
    <ScrollArea className="pr-2">
      <div className="flex flex-col gap-2 px-2 pb-2">
        <LoadMore
          loadMoreAction={loadMoreMessages}
          initialOffset={{ query, workspaceId, offset: PAGE_SIZE }}
        >
          {messagesData.map((message) => (
            <Message key={message.message.id} message={message.message} />
          ))}
        </LoadMore>
      </div>
    </ScrollArea>
  ) : !!query?.length ? (
    <div className="flex items-center justify-center flex-col flex-1 text-sm">
      <span>No messages found. Please retry your filter.</span>
    </div>
  ) : (
    <div className="flex items-center justify-center flex-col flex-1 text-sm">
      <span>There are no messages in this workspace.</span>
      <Link href="/data/messages" className=" text-blue-600">
        View Messages to Add
      </Link>
    </div>
  );
};

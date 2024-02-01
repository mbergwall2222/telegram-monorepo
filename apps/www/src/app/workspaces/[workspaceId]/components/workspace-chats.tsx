import { ScrollArea } from "@/components/ui/scroll-area";
import { Chat } from "./chat";
import {
  and,
  chats,
  db,
  desc,
  eq,
  inArray,
  sql,
  workspaces,
  workspacesToChats,
} from "@telegram/db";
import { elasticClient } from "@/lib/server/elastic";
import { IUser } from "@/lib/types/users";
import { env } from "@/env.mjs";
import LoadMore from "./load-more";

const PAGE_SIZE = 10;

type GetChatsParams = {
  query?: string;
  offset: number | null;
  workspaceId: string;
};
const getChats = async ({ query, offset, workspaceId }: GetChatsParams) => {
  if (offset == null) return [];

  let chatsData: Awaited<
    ReturnType<
      typeof db.query.workspacesToChats.findMany<{
        with: {
          chat: true;
        };
      }>
    >
  >;

  if (!query)
    chatsData = await db.query.workspacesToChats.findMany({
      where: eq(workspacesToChats.workspaceId, workspaceId),
      with: {
        chat: true,
      },
    });
  else {
    const matchedChats = await elasticClient.search<IChat>({
      index: `${env.ELASTICSEARCH_PREFIX}.telegram.chats`,
      query: {
        bool: {
          should: query
            .split(" ")
            .map((q) => [
              {
                wildcard: {
                  title: {
                    value: `*${q}*`,
                    boost: 5.0,
                  },
                },
              },
              {
                wildcard: {
                  description: {
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
    });

    console.log(
      `Matched ${matchedChats.hits.hits.length} chats - Took ${matchedChats.took}ms`
    );

    const ids = matchedChats.hits.hits.map((hit) => hit._id);
    if (!ids.length) chatsData = [];
    else {
      chatsData = await db.query.workspacesToChats.findMany({
        where: and(
          eq(workspacesToChats.workspaceId, workspaceId),
          inArray(workspacesToChats.chatId, ids)
        ),
        with: {
          chat: true,
        },
      });
      chatsData = ids.map(
        (id) =>
          chatsData.find(
            (chat) => chat.chat.id == id
          ) as (typeof chatsData)[number]
      );
    }
  }
  return chatsData;
};

async function loadMoreChats(data: GetChatsParams) {
  "use server";

  if (data.offset == null) return [, null];
  const chatsData = await getChats(data);

  const nextOffset =
    chatsData.length >= PAGE_SIZE ? data.offset + PAGE_SIZE : null;
  console.log("oldData", data);
  data.offset = nextOffset;
  console.log("newData", data);
  return [
    <>
      {chatsData.map((workspaceChat) => (
        <Chat key={workspaceChat.chat.id} chat={workspaceChat.chat} />
      ))}
    </>,
    data,
  ] as const;
}

export const WorkspaceChats = async ({
  workspaceId,
  query,
}: {
  workspaceId: string;
  query?: string;
}) => {
  const chatsData = await getChats({ query, workspaceId, offset: 0 });

  return chatsData.length ? (
    <ScrollArea className="pr-2">
      <div className="flex flex-col gap-2 px-2 pb-2">
        <LoadMore
          loadMoreAction={loadMoreChats}
          initialOffset={{ query, workspaceId, offset: PAGE_SIZE }}
        >
          {chatsData.map((workspaceChat) => (
            <Chat key={workspaceChat.chat.id} chat={workspaceChat.chat} />
          ))}
        </LoadMore>
      </div>
    </ScrollArea>
  ) : !!query?.length ? (
    <div className="flex items-center justify-center flex-col flex-1 text-sm">
      <span>No chats found. Please retry your filter.</span>
    </div>
  ) : (
    <div className="flex items-center justify-center flex-col flex-1 text-sm">
      <span>There are no chats in this workspace.</span>
    </div>
  );
};

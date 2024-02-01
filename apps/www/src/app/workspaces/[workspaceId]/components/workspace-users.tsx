import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "./user";
import { and, db, eq, inArray, workspacesToUsers } from "@telegram/db";
import Link from "next/link";
import { elasticClient } from "@/lib/server/elastic";
import { IUser } from "@/lib/types/users";
import { env } from "@/env.mjs";
import LoadMore from "./load-more";

const PAGE_SIZE = 10;

type GetUsersParams = {
  query?: string;
  offset: number | null;
  workspaceId: string;
};

const getUsers = async ({ query, offset, workspaceId }: GetUsersParams) => {
  console.log("Getting Users", query, offset, workspaceId);
  if (offset == null) return [];
  let usersData: Awaited<
    ReturnType<
      typeof db.query.workspacesToUsers.findMany<{
        with: {
          user: true;
        };
      }>
    >
  >;

  if (!query)
    usersData = await db.query.workspacesToUsers.findMany({
      where: eq(workspacesToUsers.workspaceId, workspaceId),
      with: {
        user: true,
      },
      offset: offset ?? 0,
      limit: PAGE_SIZE,
    });
  else {
    const matchedUsers = await elasticClient.search<IUser>({
      index: `${env.ELASTICSEARCH_PREFIX}.telegram.users`,
      query: {
        bool: {
          should: query
            .split(" ")
            .map((q) => [
              {
                wildcard: {
                  first_name: {
                    value: `*${q}*`,
                    boost: 5.0,
                  },
                },
              },
              {
                wildcard: {
                  last_name: {
                    value: `*${q}*`,
                    boost: 5.0,
                  },
                },
              },
              {
                wildcard: {
                  username: {
                    value: `*${q}*`,
                    boost: 2.0,
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
      `Matched ${matchedUsers.hits.hits.length} users - Took ${matchedUsers.took}ms`
    );

    const ids = matchedUsers.hits.hits.map((hit) => hit._id);

    if (!ids.length) usersData = [];
    else {
      usersData = await db.query.workspacesToUsers.findMany({
        where: and(
          eq(workspacesToUsers.workspaceId, workspaceId),
          inArray(workspacesToUsers.userId, ids)
        ),
        with: {
          user: true,
        },
      });
      usersData = ids.map(
        (id) =>
          usersData.find(
            (user) => user.user.id == id
          ) as (typeof usersData)[number]
      );
    }
  }
  return usersData;
};

async function loadMoreUsers(data: GetUsersParams) {
  "use server";

  if (data.offset == null) return [, null];
  const usersData = await getUsers(data);

  const nextOffset =
    usersData.length >= PAGE_SIZE ? data.offset + PAGE_SIZE : null;
  data.offset = nextOffset;
  return [
    <>
      {usersData.map((user) => (
        <User key={user.user.id} user={user.user} />
      ))}
    </>,
    data,
  ] as const;
}

export const WorkspaceUsers = async ({
  workspaceId,
  query,
}: {
  workspaceId: string;
  query?: string;
}) => {
  const usersData = await getUsers({ query, workspaceId, offset: 0 });
  return usersData.length ? (
    <ScrollArea className="pr-2">
      <div className="flex flex-col gap-2 px-2 pb-2">
        <LoadMore
          loadMoreAction={loadMoreUsers}
          initialOffset={{ query, workspaceId, offset: PAGE_SIZE }}
        >
          {usersData.map((user) => (
            <User key={user.user.id} user={user.user} />
          ))}
        </LoadMore>
      </div>
    </ScrollArea>
  ) : !!query?.length ? (
    <div className="flex items-center justify-center flex-col flex-1 text-sm">
      <span>No users found. Please retry your filter.</span>
    </div>
  ) : (
    <div className="flex items-center justify-center flex-col flex-1 text-sm">
      <span>There are no users in this workspace.</span>
      <Link href="/data/users" className=" text-blue-600">
        View Users to Add
      </Link>
    </div>
  );
};

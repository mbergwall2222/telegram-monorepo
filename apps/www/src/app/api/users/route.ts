import { getUsers } from "@/lib/server/api";
import { IGetEnrichedUsersResponse } from "@/lib/types/users";
import { replaceNullStrings } from "@/lib/utils";
import { GetUsersParams, getUsersSearchParamsSchema } from "@/schemas/getUsers";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validation = getUsersSearchParamsSchema.safeParse(searchParams);
  if (!validation.success) return NextResponse.json(validation.error);

  const params: GetUsersParams = validation.data;

  const users = await getUsers(params);
  return NextResponse.json(users as IGetEnrichedUsersResponse);
}

// export const revalidate = 10;

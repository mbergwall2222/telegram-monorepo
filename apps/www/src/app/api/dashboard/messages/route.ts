import { getDashboardMessages } from "@/lib/server/dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  const res = await getDashboardMessages();

  return NextResponse.json(res);
}

export const revalidate = 30;

import { Input } from "@/components/ui/input";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Suspense, useMemo } from "react";
import { CardLoader } from "@/components/dashboard/CardLoader";
import { TotalMessagesStored } from "@/components/dashboard/TotalMessagesStored";
import { TotalUsersStored } from "@/components/dashboard/TotalUsersStored";
import { TotalChatsStored } from "@/components/dashboard/TotalChatsStored";
import { MessagesPerDay } from "@/components/dashboard/MessagesPerDay";
import { MessagesPerMonth } from "@/components/dashboard/MessagesPerMonth";
import { MessagesChart } from "@/components/dashboard/MessagesChart";
import { WrappedDataCard } from "@/components/dashboard/WrappedDataCard";
import {
  getDashboardChats,
  getDashboardMessages,
  getDashboardUsers,
} from "@/lib/server/dashboard";
import { DashboardServer } from "./dashboard-server";

const Loader = () => (
  <div
    className={cn(
      "bg-gray-100/20border-r dark:bg-gray-800/20 flex h-screen flex-col flex-none w-full gap-4  px-4"
      // fullWidth ? "w-full" : "w-96 flex-none"
    )}
  >
    <div className="flex items-center justify-between space-x-4 h-12 border-b border-black">
      <div className="font-medium text-sm">X21 - Dashboard</div>
    </div>
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <CardLoader title="Total Messages Stored" />
        <CardLoader title="Total Users Stored" />
        <CardLoader title="Total Chats Stored" />
      </div>
      <CardLoader title="Messages per Day" height="300px" />
    </div>
  </div>
);

export default async function Home() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardServer />
    </Suspense>
  );
}

"use client";

import { getDashboardChats, getDashboardUsers } from "@/lib/client/api";
import { valueFormatter } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Counter from "./Counter";

export const TotalUsersStored = () => {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-users"],
    queryFn: getDashboardUsers,
  });
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total Users Stored
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <Counter value={data.totalAllTime} />
        </div>
      </CardContent>
    </Card>
  );
};

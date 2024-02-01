"use client";

import { getDashboardMessages } from "@/lib/client/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { valueFormatter } from "@/lib/utils";
import { useMemo } from "react";
import Counter from "./Counter";

export const TotalMessagesStored = () => {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-messages"],
    queryFn: getDashboardMessages,
    refetchInterval: 30000,
  });

  const relativeToLastMonth = useMemo(() => {
    if (!data) return 0;
    const thisMonth = data.totalLast30Days;
    const lastMonth = data.totalPrevious30Days;

    const percentChange = ((thisMonth - lastMonth) / lastMonth) * 100;

    return percentChange;
  }, [data]);

  const percentChangeFormatter = (percentChange: number) =>
    percentChange > 0
      ? `+${percentChange.toFixed(1)}`
      : percentChange.toFixed(1);

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total Messages Stored
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <Counter value={data.totalAllTime} />
        </div>
        <p className="text-xs text-muted-foreground">
          <Counter
            value={relativeToLastMonth}
            formatter={percentChangeFormatter}
          />
          % from last month
        </p>
      </CardContent>
    </Card>
  );
};

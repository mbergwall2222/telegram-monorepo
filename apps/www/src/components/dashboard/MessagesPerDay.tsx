"use client";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { valueFormatter } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getDashboardMessages } from "@/lib/client/api";
import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { CustomTooltip } from "./CustomTooltip";

function formatXAxis(tickItem: UTCDate) {
  return format(new UTCDate(tickItem), "MMM d");
  return "";
}

export const MessagesPerDay = () => {
  const { data: dataRaw } = useSuspenseQuery({
    queryKey: ["dashboard-messages"],
    queryFn: getDashboardMessages,
    refetchInterval: 30000,
  });

  const data = dataRaw?.dailyCountsLast365Days.map((o) => ({
    day: new Date(o.day).getTime(),
    count: o.count,
  }));

  if (!data) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ left: 0, right: 24, top: 10 }}>
        <CartesianGrid strokeDasharray="2 2" vertical={false} />

        <XAxis
          dataKey="day"
          className="fill-primary"
          stroke="currentColor"
          fontSize={12}
          tickLine={true}
          axisLine={false}
          tickFormatter={formatXAxis}
        />
        <YAxis
          className="fill-primary"
          stroke="currentColor"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip {...props} isDate payloadLabel="New Messages" />
          )}
        />
        <Brush
          dataKey="day"
          data={data}
          height={30}
          startIndex={335}
          padding={{ right: 20, left: 0, top: 0, bottom: 0 }}
          stroke="#000"
          tickFormatter={formatXAxis}
        />

        <Line
          type="monotone"
          dataKey="count"
          className="fill-primary"
          stroke="currentColor"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

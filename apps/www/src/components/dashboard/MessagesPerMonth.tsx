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
import { useMemo } from "react";
import { CustomTooltip } from "./CustomTooltip";
import { useTheme } from "next-themes";

function formatXAxis(tickItem: UTCDate) {
  return format(new UTCDate(tickItem), "MMM ''yy");
  return "";
}
export const MessagesPerMonth = () => {
  const { data: dataRaw } = useSuspenseQuery({
    queryKey: ["dashboard-messages"],
    queryFn: getDashboardMessages,
    refetchInterval: 30000,
  });

  const data = dataRaw.monthlyCountsThisYear.map((o) => ({
    day: new Date(o.day).getTime(),
    count: o.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ left: 0, right: 24, top: 10 }}>
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
        {data?.length && (
          <Brush
            dataKey="day"
            data={data}
            height={30}
            startIndex={0}
            padding={{ right: 20, left: 0, top: 0, bottom: 0 }}
            stroke="#000"
            tickFormatter={formatXAxis}
          />
        )}
        <Bar
          dataKey="count"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
          // dot={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

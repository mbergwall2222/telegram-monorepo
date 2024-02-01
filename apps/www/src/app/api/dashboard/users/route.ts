import { getDashboardUsers } from "@/lib/server/dashboard";
import { auth } from "@clerk/nextjs";
import { UTCDate } from "@date-fns/utc";

import {
  subDays,
  subMonths,
  subYears,
  isWithinInterval,
  parseISO,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import { NextResponse } from "next/server";

interface DataPoint {
  day: string;
  count: number;
}

function filterDataByInterval(
  data: DataPoint[],
  startDate: Date,
  endDate: Date
) {
  return data.filter((point) => {
    const day = parseISO(point.day);
    return isWithinInterval(day, { start: startDate, end: endDate });
  });
}

function calculateDailyCounts(data: DataPoint[], days: number) {
  const dailyCounts: DataPoint[] = [];
  const periodStart = subDays(new Date(), days);

  eachDayOfInterval({ start: periodStart, end: new Date() }).forEach((day) => {
    const dayData = filterDataByInterval(data, day, day);
    dailyCounts.push({ day: day.toISOString(), count: sumCounts(dayData) });
  });

  return dailyCounts;
}

function calculateCountsOverPeriod(
  data: DataPoint[],
  periodFunction: (interval: { start: Date; end: Date }) => Date[],
  startPeriod: Date,
  endPeriod: Date
) {
  const counts: DataPoint[] = [];
  periodFunction({ start: startPeriod, end: endPeriod }).forEach(
    (intervalStart) => {
      let intervalEnd;

      if (periodFunction === eachDayOfInterval) {
        // Since data points represent the start of each day, we use the same date for start and end
        intervalEnd = intervalStart;
      } else if (periodFunction === eachWeekOfInterval) {
        intervalEnd = subDays(intervalStart, 7);
      } else if (periodFunction === eachMonthOfInterval) {
        intervalEnd = subMonths(intervalStart, 1);
      } else {
        throw new Error("Invalid period function");
      }

      const periodData = filterDataByInterval(data, intervalStart, intervalEnd);
      counts.push({
        day: intervalStart.toISOString(),
        count: sumCounts(periodData),
      });
    }
  );

  return counts;
}

function sumCounts(data: DataPoint[]): number {
  return data.reduce((acc, point) => acc + point.count, 0);
}

export async function GET() {
  const data = await getDashboardUsers();

  return NextResponse.json(data);
}

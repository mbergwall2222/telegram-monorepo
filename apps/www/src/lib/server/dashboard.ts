import { getXataClient } from "../xata";
import { UTCDate } from "@date-fns/utc";
import { elasticClient } from "./elastic";
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
import {
  AggregationsAutoDateHistogramAggregate,
  AggregationsDateHistogramAggregation,
  AggregationsFilterAggregate,
  AggregationsValueCountAggregate,
} from "@elastic/elasticsearch/lib/api/types";

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
const xata = getXataClient();

export const getDashboardMessages = async () => {
  const elasticData = await elasticClient.search<
    any,
    {
      total_count: AggregationsValueCountAggregate;
      daily: AggregationsFilterAggregate & {
        per_day: AggregationsAutoDateHistogramAggregate;
      };
      monthly: AggregationsAutoDateHistogramAggregate;
    }
  >({
    size: 0,
    index: "data.telegram.messages",
    aggs: {
      total_count: {
        value_count: {
          field: "_index",
        },
      },
      daily: {
        filter: {
          range: {
            date: {
              gte: "now-1y/d",
              lte: "now/d",
            },
          },
        },
        aggs: {
          per_day: {
            date_histogram: {
              field: "date",
              calendar_interval: "day",
              min_doc_count: 1,
              format: "strict_date_optional_time",
              extended_bounds: {
                min: "now-1y/d",
                max: "now/d",
              },
            },
          },
        },
      },
      monthly: {
        date_histogram: {
          field: "date",
          calendar_interval: "month",
          min_doc_count: 1,
          format: "strict_date_optional_time",
          extended_bounds: {
            min: "now-12M/M",
            max: "now/M",
          },
        },
      },
    },
  });
  if (
    !Array.isArray(elasticData.aggregations?.daily.per_day.buckets) ||
    !Array.isArray(elasticData.aggregations?.monthly.buckets)
  )
    throw new Error("Invalid bucket response");

  const data = elasticData.aggregations.daily.per_day.buckets.map((o) => ({
    count: o.doc_count,
    day: o.key_as_string as string,
  }));

  const now = new UTCDate();

  console.log(elasticData.aggregations.total_count);
  const totalAllTime = elasticData.aggregations.total_count.value as number;

  const dailyCountsLast7Days = filterDataByInterval(data, subDays(now, 7), now);

  const dailyCountsLast30Days = filterDataByInterval(
    data,
    subDays(now, 30),
    now
  );

  const dailyCountsPrevious30Days = filterDataByInterval(
    data,
    subDays(now, 60),
    subDays(now, 30)
  );

  const dailyCountsLast365Days = filterDataByInterval(
    data,
    subDays(now, 365),
    now
  );

  const totalLast24Hours = sumCounts(
    filterDataByInterval(data, subDays(now, 1), now)
  );
  const totalLast7Days = sumCounts(dailyCountsLast7Days);
  const totalLast30Days = sumCounts(dailyCountsLast30Days);
  const totalPrevious30Days = sumCounts(dailyCountsPrevious30Days);

  const weeklyCountsLast30Days = calculateCountsOverPeriod(
    data,
    eachWeekOfInterval,
    subDays(now, 30),
    now
  );

  const monthlyCountsThisYear = elasticData.aggregations.monthly.buckets
    .map((o) => ({
      count: o.doc_count,
      day: o.key_as_string as string,
    }))
    .slice(-12);

  return {
    totalAllTime,
    totalLast24Hours,
    totalLast30Days,
    totalPrevious30Days,
    totalLast7Days,
    dailyCountsLast365Days,
    dailyCountsLast7Days,
    dailyCountsLast30Days,
    weeklyCountsLast30Days,
    monthlyCountsThisYear,
  };
};

export const getDashboardChats = async () => {
  const aggs = await elasticClient.search<
    unknown,
    { total_count: AggregationsValueCountAggregate }
  >({
    index: "data.telegram.chats",
    size: 0,
    aggs: {
      total_count: {
        value_count: {
          field: "_index",
        },
      },
    },
  });

  return {
    totalAllTime: aggs.aggregations?.total_count.value,
  };
};

export const getDashboardUsers = async () => {
  const aggs = await elasticClient.search<
    unknown,
    { total_count: AggregationsValueCountAggregate }
  >({
    index: "data.telegram.users",
    size: 0,
    aggs: {
      total_count: {
        value_count: {
          field: "_index",
        },
      },
    },
  });

  return {
    totalAllTime: aggs.aggregations?.total_count.value,
  };
};

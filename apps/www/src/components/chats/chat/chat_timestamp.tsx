"use client";

import { formatDistance } from "date-fns";
import { useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";

export const ChatTimestamp = ({ date }: { date: Date }) => {
  const getRelativeDate = () =>
    date && formatDistance(date, new Date(), { includeSeconds: true });
  const [relativeDate, setRelativeDate] = useState<string | undefined>();

  useEffect(() => {
    setRelativeDate(getRelativeDate());
  }, [date]);

  useInterval(() => {
    setRelativeDate(getRelativeDate());
  }, 1000);

  return <>{relativeDate && `Last message: ${relativeDate} ago`}</>;
};

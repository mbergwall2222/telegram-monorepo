"use client";

import { getMessage } from "@/lib/client/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { IMessageProps, Message } from "./message";
import { Suspense } from "react";

export type IMessageLoaderProps = Omit<IMessageProps, "message"> & {
  messageId: string;
};
export const MessageLoader = (props: IMessageLoaderProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessageLoaderSuspensed {...props}></MessageLoaderSuspensed>
    </Suspense>
  );
};

const MessageLoaderSuspensed = ({
  messageId,
  ...props
}: IMessageLoaderProps) => {
  const { data } = useSuspenseQuery({
    queryKey: ["message", messageId],
    queryFn: () => getMessage(messageId),
    staleTime: Infinity,
  });

  return <Message {...props} message={data} />;
};

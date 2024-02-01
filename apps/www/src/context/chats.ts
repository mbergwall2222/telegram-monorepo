"use client";
import { createContext } from "react";
import mitt, { Emitter, EventType } from "mitt";

export const ChatsContext = createContext<{
  chats: IChat[];
  isLoading: boolean;
}>({
  chats: [],
  isLoading: false,
});

import { SelectedPick } from "@xata.io/client";
import { TagsToChatsRecord } from "./xata";

type IBuildTags = {chatId: string; tagId: string; tag: {name: string}}[];
export const buildTags = (
  tags: IBuildTags
) => {
  const chats: Record<string, { id: string; name: string }[]> = {};

  tags.forEach((tag) => {
    const chatId = tag?.chatId;
    const tagId = tag?.tagId;
    const tagName = tag?.tag?.name;

    if (!chatId || !tagId || !tagName) return;

    if (!chats[chatId]) {
      chats[chatId] = [];
    }

    chats[chatId].push({
      id: tagId,
      name: tagName,
    });
  });
  return chats;
};

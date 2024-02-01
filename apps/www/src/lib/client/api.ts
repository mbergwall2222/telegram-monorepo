import { GetMessagesParams } from "@/schemas/getMessages";
import {
  IChatsSearchResponse,
  IGetChatResponse,
  IGetChatsResponse,
} from "../types/chats";
import {
  IGetChatMessagesResponse,
  IMessage,
  IMessagesDashboardResponse,
  IGetMessagesResponse,
} from "../types/messages";
import {
  IChatAllTagsResponse,
  IChatTagsResponse,
  ICreateTagResponse,
  ILinkTagResponse,
} from "../types/tags";
import {
  convertToRecordOfString,
  getBaseUrl,
  objectToURLSearchParams,
} from "../utils";
import { IGetEnrichedUsersResponse, IGetUsersResponse } from "../types/users";
import { GetUsersParams } from "@/schemas/getUsers";
import { SavedSearch } from "../types/searches";

export const getLinkedChatTags = async (chatId: string) => {
  return fetch(`${getBaseUrl()}/api/chats/${chatId}/tags`).then(
    (res) => res.json() as Promise<IChatTagsResponse>
  );
};

export const getLinkedUserTags = async (userId: string) => {
  return fetch(`${getBaseUrl()}/api/users/${userId}/tags`).then(
    (res) => res.json() as Promise<IChatTagsResponse>
  );
};

export const getLinkedMessageTags = async (messageId: string) => {
  return fetch(`${getBaseUrl()}/api/messages/${messageId}/tags`).then(
    (res) => res.json() as Promise<IChatTagsResponse>
  );
};

export const getAllTags = async () => {
  return fetch(`${getBaseUrl()}/api/tags`).then(
    (res) => res.json() as Promise<IChatAllTagsResponse>
  );
};

export const searchForTags = async (query: string) => {
  return fetch(`${getBaseUrl()}/api/tags/searches`, {
    method: "POST",
    body: JSON.stringify({ query }),
  }).then((res) => res.json() as Promise<IChatAllTagsResponse>);
};

export const linkChatTag = async (tagId: string, chatId: string) => {
  return fetch(`${getBaseUrl()}/api/chats/${chatId}/tags`, {
    method: "POST",
    body: JSON.stringify({ id: tagId }),
  }).then((res) => res.json() as Promise<ILinkTagResponse>);
};

export const unlinkChatTag = async (tagId: string, chatId: string) => {
  return fetch(`${getBaseUrl()}/api/chats/${chatId}/tags/${tagId}`, {
    method: "DELETE",
  }).then((res) => res.json() as Promise<{ success: boolean }>);
};

export const linkUserTag = async (tagId: string, userId: string) => {
  return fetch(`${getBaseUrl()}/api/users/${userId}/tags`, {
    method: "POST",
    body: JSON.stringify({ id: tagId }),
  }).then((res) => res.json() as Promise<ILinkTagResponse>);
};

export const linkMessageTag = async (tagId: string, messageId: string) => {
  return fetch(`${getBaseUrl()}/api/messages/${messageId}/tags`, {
    method: "POST",
    body: JSON.stringify({ id: tagId }),
  }).then((res) => res.json() as Promise<ILinkTagResponse>);
};

export const unlinkUserTag = async (tagId: string, userId: string) => {
  return fetch(`${getBaseUrl()}/api/users/${userId}/tags/${tagId}`, {
    method: "DELETE",
  }).then((res) => res.json() as Promise<{ success: boolean }>);
};

export const unlinkMessageTag = async (tagId: string, messageId: string) => {
  return fetch(`${getBaseUrl()}/api/messages/${messageId}/tags/${tagId}`, {
    method: "DELETE",
  }).then((res) => res.json() as Promise<{ success: boolean }>);
};
export const createTag = async (name: string, description?: string) => {
  return fetch(`${getBaseUrl()}/api/tags`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  }).then((res) => res.json() as Promise<ICreateTagResponse>);
};

export const createAndLinkChatTag = async (
  chatId: string,
  tag: { name: string; description?: string }
) => {
  const { tag: _tag } = await createTag(tag.name, tag.description);
  await linkChatTag(_tag.id, chatId);
  return _tag;
};

export const createAndLinkUserTag = async (
  chatId: string,
  tag: { name: string; description?: string }
) => {
  const { tag: _tag } = await createTag(tag.name, tag.description);
  await linkUserTag(_tag.id, chatId);
  return _tag;
};

export const createAndLinkMessageTag = async (
  chatId: string,
  tag: { name: string; description?: string }
) => {
  const { tag: _tag } = await createTag(tag.name, tag.description);
  await linkMessageTag(_tag.id, chatId);
  return _tag;
};

export const getChats = async (cursor?: string) => {
  return fetch(
    `${getBaseUrl()}/api/chats?` + new URLSearchParams({ cursor: cursor ?? "" })
  ).then((res) => res.json() as Promise<IGetChatsResponse>);
};
export const getUsers = async (params: GetUsersParams) => {
  return fetch(
    `${getBaseUrl()}/api/users?` +
      new URLSearchParams(objectToURLSearchParams(params))
  ).then((res) => res.json() as Promise<IGetEnrichedUsersResponse>);
};

export const searchForChats = async (query: string) => {
  return fetch(`${getBaseUrl()}/api/chats/searches`, {
    method: "POST",
    body: JSON.stringify({ query }),
  }).then((res) => res.json() as Promise<IGetChatsResponse>);
};

export const saveUserSearch = async ({
  name,
  query,
}: {
  name: string;
  query: string;
}) => {
  return fetch(`${getBaseUrl()}/api/users/searches`, {
    method: "PUT",
    body: JSON.stringify({ name, query }),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to save search");
    return res.json() as Promise<any>;
  });
};

export const saveMessageSearch = async ({
  name,
  query,
}: {
  name: string;
  query: string;
}) => {
  return fetch(`${getBaseUrl()}/api/messages/searches`, {
    method: "PUT",
    body: JSON.stringify({ name, query }),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to save search");
    return res.json() as Promise<any>;
  });
};

export const getChat = async (id?: string) => {
  return fetch(`${getBaseUrl()}/api/chats/${id}`).then(
    (res) => res.json() as Promise<IGetChatResponse>
  );
};

export const getChatMessages = async (
  id: string,
  userId?: string,
  cursor?: string
) => {
  return fetch(
    `${getBaseUrl()}/api/chats/${id}/messages?` +
      new URLSearchParams({ userId: userId ?? "", cursor: cursor ?? "" })
  ).then((res) => res.json() as Promise<IGetChatMessagesResponse>);
};

export const getMessage = async (messageId: string) => {
  return fetch(`${getBaseUrl()}/api/messages/${messageId}`).then(
    (res) => res.json() as Promise<IMessage>
  );
};

export const getMessages = async (params: GetMessagesParams) => {
  return fetch(
    `${getBaseUrl()}/api/messages?` +
      new URLSearchParams(objectToURLSearchParams(params))
  ).then((res) => res.json() as Promise<IGetMessagesResponse>);
};

export const getUserSearches = async () => {
  return fetch(`${getBaseUrl()}/api/users/searches`).then(
    (res) => res.json() as Promise<SavedSearch[]>
  );
};

export const getMessageSearches = async () => {
  return fetch(`${getBaseUrl()}/api/messages/searches`).then(
    (res) => res.json() as Promise<SavedSearch[]>
  );
};

export const searchForChatMessages = async (chatId: string, query: string) => {
  return fetch(`${getBaseUrl()}/api/chats/${chatId}/messages/searches`, {
    method: "POST",
    body: JSON.stringify({ query }),
  }).then((res) => res.json() as Promise<IGetChatMessagesResponse>);
};

export const searchForUsers = async (query: string) => {
  return fetch(`${getBaseUrl()}/api/users/searches`, {
    method: "POST",
    body: JSON.stringify({ query }),
  }).then((res) => res.json() as Promise<IGetUsersResponse>);
};

export const searchForMessages = async (query: string) => {
  return fetch(`${getBaseUrl()}/api/messages/searches`, {
    method: "POST",
    body: JSON.stringify({ query }),
  }).then((res) => res.json() as Promise<IGetChatMessagesResponse>);
};

export const getDashboardMessages = async () => {
  return fetch(`${getBaseUrl()}/api/dashboard/messages`, {
    method: "GET",
  }).then((res) => res.json() as Promise<IMessagesDashboardResponse>);
};

export const getDashboardChats = async () => {
  return fetch(`${getBaseUrl()}/api/dashboard/chats`, {
    method: "GET",
  }).then((res) => res.json() as Promise<{ totalAllTime: number }>);
};

export const getDashboardUsers = async () => {
  return fetch(`${getBaseUrl()}/api/dashboard/users`, {
    method: "GET",
  }).then((res) => res.json() as Promise<{ totalAllTime: number }>);
};

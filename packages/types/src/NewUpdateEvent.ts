import {
  ChatsRecord,
  DocumentsRecord,
  EditableData,
  MessagesRecord,
  UsersRecord,
} from "@telegram/xata";

export type NewUpdateEvent = {
  id: string;
  date: string;
  messageId: string;
  messageText: string;
  fromUser: string;
  fromUserFull?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    pfpUrl?: string;
    description?: string;
  };
  toChat: string;
  fromChatFull?: {
    id: string;
    isGroup: boolean;
    isChannel: boolean;
    title?: string;
    memberCount?: number;
    pfpUrl?: string;
    description?: string;
  };
  mediaId?: string;
  media?: {
    fileId: string;
    fileName: string;
    fileSize?: number;
    mimeType: string;
    fileUrl: string;
  };
  entities?: object | string;
  groupId?: string;
  inReplyToId?: string;
};

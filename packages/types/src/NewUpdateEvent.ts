import {
  ChatsRecord,
  DocumentsRecord,
  EditableData,
  MessagesRecord,
  UsersRecord,
} from "@telegram/xata";

export type NewUpdateEvent = Omit<
  EditableData<MessagesRecord>,
  "media" | "entities"
> & {
  fromUserFull?: EditableData<UsersRecord>;
  fromChatFull?: EditableData<ChatsRecord>;
  media?: Omit<EditableData<DocumentsRecord>, "id">;
  mediaId?: string;
  entities: string;
};

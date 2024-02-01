export type IChat = {
  description?: string | null;
  id: string;
  telegramId: string;
  isChannel: boolean;
  isGroup: boolean;
  lastMessageDate: string | Date;
  pfpUrl?: string | null;
  title: string | null;
  memberCount: any;
};

export type IGetChatsResponse = {
  chats: Array<IChat>;
  page: {
    next: number;
  };
};

export type IGetChatResponse = {
  chat: IChat;
};

export type IChatsSearchResponse = {
  totalCount: number;
  records: Array<{
    table: string;
    record: {
      description: string;
      id: string;
      isChannel: boolean;
      isGroup: boolean;
      lastMessageDate: string;
      memberCount: number;
      pfpUrl: string;
      title: string;
      xata: {
        createdAt: string;
        highlight: {
          description?: Array<string>;
          title: Array<string>;
        };
        score: number;
        table: string;
        updatedAt: string;
        version: number;
      };
    };
  }>;
};

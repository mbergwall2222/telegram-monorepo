import { MessageEntity } from "@/lib/types/telegram";

export type IMessage = {
  id: string;
  messageText: string;
  date: string | Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    pfpUrl: string;
  };
  chat?: {
    id: string;
    title: string;
    pfpUrl: string;
  };
  document?: {
    fileId: string;
    fileName: string;
    fileSize: number | null;
    fileUrl: string;
    id: string;
    mimeType: string;
  };
  entities?: MessageEntity[];
  messageId: string;
  inReplyToId?: string;
};

export type IGetChatMessagesResponse = {
  messages: Array<IMessage>;
  page: {
    next: number;
  };
};

export type IMessagesDashboardResponse = {
  totalAllTime: number;
  totalLast24Hours: number;
  totalLast30Days: number;
  totalPrevious30Days: number;
  totalLast7Days: number;
  dailyCountsLast7Days: Array<{
    count: number;
    day: string;
  }>;
  dailyCountsLast30Days: Array<{
    count: number;
    day: string;
  }>;
  dailyCountsLast365Days: Array<{
    count: number;
    day: string;
  }>;
  weeklyCountsLast30Days: Array<{
    day: string;
    count: number;
  }>;
  monthlyCountsThisYear: Array<{
    day: string;
    count: number;
  }>;
};

export type IGetMessagesResponse = {
  data: IMessage[];
  totalRecords: number;
};

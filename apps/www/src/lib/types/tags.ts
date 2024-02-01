import { BadgeVariants } from "@/components/ui/badge";

export type ITag = {
  description?: string | null;
  id: string;
  name: string;
  variant?: string | null; // BadgeVariants;
  order: number;
};

export type IChatTagsResponse = {
  tags: Array<{
    tag: ITag;
  }>;
};

export type ILinkTagResponse = {
  success: boolean;
  linkedTag: { chatId: string; tagId: string };
};

export type ILinkTagMessageResponse = {
  success: boolean;
  linkedTag: { messageId: string; tagId: string };
};

export type ILinkTagUserResponse = {
  success: boolean;
  linkedTag: { userId: string; tagId: string };
};

export type IChatAllTagsResponse = {
  tags: ITag[];
};

export type ICreateTagResponse = {
  success: boolean;
  tag: ITag;
};

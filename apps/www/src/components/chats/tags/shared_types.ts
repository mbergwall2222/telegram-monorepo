import {
  IChatAllTagsResponse,
  IChatTagsResponse,
  ILinkTagResponse,
  ITag,
} from "@/lib/types/tags";

interface DisableEditProps {
  disableEdit: true;
}
interface EditTagProps {
  disableEdit?: false | undefined;
  getAllTags: () => Promise<IChatAllTagsResponse>;
  linkTag: (tagId: string, entityId: string) => Promise<ILinkTagResponse>;
  unlinkTag: (tagId: string, entityId: string) => Promise<{ success: boolean }>;
  createAndLinkTag: (
    chatId: string,
    tag: {
      name: string;
      description?: string;
    }
  ) => Promise<ITag>;
}

type UnknownEditProps = DisableEditProps | EditTagProps;

export type ITagsPropsBase = {
  entityName: string;
  entityId: string;
  getLinkedTags: (entityId: string) => Promise<IChatTagsResponse>;
};

export type ITagsUnknownProps = ITagsPropsBase & UnknownEditProps;
export type ITagsProps = ITagsPropsBase & EditTagProps;

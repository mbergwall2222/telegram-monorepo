"use client";
import { Badge } from "@/components/ui/badge";
import { NewTag } from "./new_tag";
import { Suspense } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ITagsProps, ITagsUnknownProps } from "./shared_types";
import { Skeleton } from "@/components/ui/skeleton";

export const Tags = (props: ITagsUnknownProps) => {
  const { data } = useSuspenseQuery({
    queryKey: [`${props.entityName}-tags`, props.entityId],
    queryFn: () => props.getLinkedTags(props.entityId),
    staleTime: Infinity,
  });

  return (
    <div className="flex items-center gap-2 z-10">
      {data.tags
        .sort((a, b) => {
          if (!a?.tag || !b?.tag) return 0;
          if (a?.tag?.order < b.tag.order) return -1;
          else if (a.tag.order > b.tag.order) return 1;
          else if (a.tag.name > b.tag.name) return 1;
          else return -1;
        })
        .map((tag) => (
          <Badge
            key={tag.tag.id}
            className="text-xs text-nowrap"
            variant={tag.tag.variant as any ?? "default"}
          >
            {tag?.tag?.name}
          </Badge>
        ))}
      {!props.disableEdit && (
        <Suspense
          fallback={
            <div className="w-full">
              <Skeleton className="w-full h-8" />
            </div>
          }
        >
          <NewTag {...props} />
        </Suspense>
      )}
    </div>
  );
};

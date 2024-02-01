"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IChatAllTagsResponse, IChatTagsResponse } from "@/lib/types/tags";
import { ITagsProps } from "./shared_types";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "The tag name must be greater than 2 characters." })
    .max(32, { message: "The tag name must be less than 32 characters." }),
  description: z
    .string()
    .max(100, { message: "The description must be less than 100 characters." })
    .optional(),
});
export function NewTagDialog({
  children,
  initialValue,
  entityId,
  entityName,
  createAndLinkTag,
}: {
  children: React.ReactNode;
  initialValue: string;
  entityId: string;
  entityName: string;
  createAndLinkTag: ITagsProps["createAndLinkTag"];
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValue,
    },
    mode: "onChange",
  });

  const queryClient = useQueryClient();

  const queryKey = [`${entityName}-tags`, entityId];
  const tagMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => {
      return createAndLinkTag(entityId, data);
    },
    onMutate: async (newTag: { name: string; description?: string }) => {
      setOpen(false);
      await Promise.all([
        queryClient.cancelQueries({ queryKey }),
        queryClient.cancelQueries({ queryKey: ["tags"] }),
      ]);

      let previousData = queryClient.getQueryData<IChatTagsResponse>(queryKey);
      let previousAllTagsData = queryClient.getQueryData<IChatAllTagsResponse>([
        "tags",
      ]);

      if (!previousData) previousData = { tags: [] };
      if (!previousAllTagsData) previousAllTagsData = { tags: [] };

      const newTagData = {
        id: "",
        tag: {
          id: "",
          name: newTag.name,
          description: newTag.description,
          order: 10,
        },
      };

      queryClient.setQueryData<IChatTagsResponse>(queryKey, {
        tags: [...previousData.tags, newTagData],
      });

      queryClient.setQueryData<IChatAllTagsResponse>(["tags"], {
        tags: [
          ...previousAllTagsData.tags,
          {
            id: "",
            name: newTag.name,
            description: newTag.description,
            order: 10,
          },
        ],
      });

      return { previousData, previousAllTagsData, newTag };
    },
    onError: (err, newTag, context) => {
      setOpen(true);
      queryClient.setQueryData(queryKey, context?.previousData);
      queryClient.setQueryData(["tags"], context?.previousAllTagsData);
    },
    onSettled: (newTag) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const router = useRouter();

  useEffect(() => {
    form.setValue("name", initialValue);
  }, [initialValue]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New tag</DialogTitle>
          <DialogDescription>
            Create a new tag to add to a chat, user or message here. The
            description is optional but recommended. It will automatically be
            attached to the selected chat/user/message.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit((data) => tagMutation.mutate(data))}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name of the tag. It must be between 2 and 18
                    characters. It will show in the chat list.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your description here."
                      className="col-span-3"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the tag description. It is optional but recommended.
                    This description will show when you hover over the tag.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <SubmitButton
                errors={!form.formState.isDirty || !form.formState.isValid}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const SubmitButton = ({ errors }: { errors: boolean }) => {
  // const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={errors}>
Create Tag    </Button>
  );
};

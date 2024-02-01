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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useSubscribedSearchParams } from "@/lib/useSubscribedSearchParams";
import { toast } from "sonner";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "The search name must be greater than 2 characters." })
    .max(32, { message: "The search name must be less than 32 characters." }),
  description: z
    .string()
    .max(100, { message: "The description must be less than 100 characters." })
    .optional(),
});

export type ISaveSearchProps = {
  saveSearch: (params: {
    name: string;
    query: string;
  }) => Promise<{ id: string }>;
  queryKey: string;
  isAsNew?: boolean;
};
export function SaveSearch({
  saveSearch,
  queryKey,
  isAsNew = false,
}: ISaveSearchProps) {
  const searchParams = useSubscribedSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const newSearchMutation = useMutation({
    mutationFn: ({ name, query }: { name: string; query: string }) =>
      saveSearch({ name, query }),
    onError: (error) => {
      toast.error("Unable to save this filter.");
    },
    onSuccess: (data) => {
      toast.success("Filter saved!");
      searchParams.set("searchId", data.id);
      router.push(pathname + "?" + searchParams.toString());
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  console.log(searchParams.toString());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          // onClick={() => setScrollLocked(false)}
        >
          <Save className="mr-2 h-4 w-4" />
          {isAsNew ? "Save as New Search" : "Save Search"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New filter</DialogTitle>
          <DialogDescription>
            Save this filter and it&apos;ll show up in your saved filters.
            Anyone in your organization can view and use this filter.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit((data) => {
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.delete("searchId");
              newSearchMutation.mutate({
                name: data.name,
                query: newSearchParams.toString(),
              });
            })}
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
                    This is the name of the search. It must be between 2 and 18
                    characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <SubmitButton
                errors={!form.formState.isDirty || !form.formState.isValid}
                pending={newSearchMutation.isPending}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const SubmitButton = ({
  errors,
  pending,
}: {
  errors: boolean;
  pending: boolean;
}) => {
  return (
    <Button type="submit" disabled={pending || errors}>
      {pending ? "Saving Search..." : "Save Search"}
    </Button>
  );
};

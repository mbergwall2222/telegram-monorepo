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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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

type CreateWorkspaceAction = (
  formData: ICreateWorkspaceForm
) => Promise<{ success: true; data: any } | { success: false; error: string }>;
export type ICreateWorkspaceForm = z.infer<typeof formSchema>;

export const CreateWorkspace = ({
  createWorkspace,
}: {
  createWorkspace: CreateWorkspaceAction;
}) => {
  const [open, setOpen] = useState(false);

  const form = useFormAction<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Workspace</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize some information. This workspace
            will be visible to all users within your organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-8"
            action={async () => {
              const actionRes = await form.handleAction(createWorkspace);
              console.log(actionRes);
              if (actionRes) {
                if (!actionRes.success) {
                  toast.error(actionRes.error);
                } else {
                  setOpen(false);
                  toast.success("Workspace created successfully!");
                }
              }
            }}
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
                    This is the name of the workspace. It must be between 2 and
                    32 characters.
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
                    This is the workspace description. It is optional but
                    recommended. This description will show when you access the
                    workspace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                // disabled={!form.formState.isDirty || !form.formState.isValid}
              >
                Create Tag{" "}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

import z from "zod";
import { useForm } from "react-hook-form";
import { trpc } from "@/trpc/client";
import { useClerk, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { commentInsertSchema } from "@/db/schema";

interface CommentFormProps {
  videoId: string;
  onSuccess?: () => void;
}

export function CommentForm({ videoId, onSuccess }: CommentFormProps) {
  const { user } = useUser();
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const create = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId });
      form.reset();
      toast.success("Comment added");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const commentFormSchema = commentInsertSchema.omit({ userId: true });

  const form = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      videoId,
      value: "",
    },
  });

  function onSubmit(values: z.infer<typeof commentFormSchema>) {
    if (!user?.id) {
      toast.error("You must be signed in to comment");
      clerk.openSignIn();
      return;
    }

    create.mutate({
      ...values,
      userId: user.id,
    } as z.infer<typeof commentInsertSchema>);
  }

  return (
    <Form {...form}>
      <form className="group flex gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <UserAvatar size="lg" imageUrl={user?.imageUrl || "/user-placeholder.png"} name={user?.username || "User"} />

        <div className="flex-1">
          <FormField
            name="value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea {...field} className="min-h-0 resize-none overflow-hidden bg-transparent" placeholder="Add a comment..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="submit" size="sm" disabled={create.isPending}>
            Comment
          </Button>
        </div>
      </form>
    </Form>
  );
}

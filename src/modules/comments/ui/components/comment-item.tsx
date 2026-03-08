import Link from "next/link";
import { CommentsGetManyOuput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/trpc/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MessagesSquareIcon, MoreVerticalIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: CommentsGetManyOuput["items"][number];
}

export function CommentItem({ comment }: CommentItemProps) {
  const { userId } = useAuth();
  const clerk = useClerk();

  const utils = trpc.useUtils();

  const remove = trpc.comments.remove.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar size="lg" imageUrl={comment.user.imageUrl} name={comment.user.name} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/users/${comment.userId}`}>
            <div className="mb-0.5 flex items-center gap-2">
              <span className="pb-0.5 text-sm font-medium">{comment.user.name}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
            </div>
          </Link>

          <p className="text-sm">{comment.value}</p>

          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center">
              <Button className="size-8" size="icon" variant="ghost" disabled={like.isPending} onClick={() => like.mutate({ commentId: comment.id })}>
                <ThumbsUpIcon className={cn(comment.viewerReaction === "like" && "fill-black")} />
              </Button>

              <span className="text-xs text-muted-foreground">{comment.likeCount}</span>

              <Button className="size-8" size="icon" variant="ghost" disabled={dislike.isPending} onClick={() => dislike.mutate({ commentId: comment.id })}>
                <ThumbsDownIcon className={cn(comment.viewerReaction === "dislike" && "fill-black")} />
              </Button>

              <span className="text-xs text-muted-foreground">{comment.dislikeCount}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon className="" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {}}>
              <MessagesSquareIcon className="size-4" />
              Reply
            </DropdownMenuItem>

            {comment.user.clerkId === userId && (
              <DropdownMenuItem onClick={() => remove.mutate({ id: comment.id })}>
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

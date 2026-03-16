import Link from "next/link";
import { CommentsGetManyOuput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/trpc/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, MessagesSquareIcon, MoreVerticalIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CommentForm } from "./comment-form";

interface CommentItemProps {
  comment: CommentsGetManyOuput["items"][number];
  variant?: "reply" | "comment";
}

export function CommentItem({ comment, variant = "comment" }: CommentItemProps) {
  const clerk = useClerk();
  const { userId } = useAuth();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);

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

            {variant === "comment" && (
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setIsReplyOpen(true)}>
                Reply
              </Button>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon className="" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {variant === "comment" && (
              <DropdownMenuItem onClick={() => setIsReplyOpen(true)}>
                <MessagesSquareIcon className="size-4" />
                Reply
              </DropdownMenuItem>
            )}

            {comment.user.clerkId === userId && (
              <DropdownMenuItem onClick={() => remove.mutate({ id: comment.id })}>
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isReplyOpen && variant === "comment" && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            videoId={comment.videoId}
            onSuccess={() => {
              setIsReplyOpen(false);
              setIsRepliesOpen(true);
            }}
            onCancle={() => {
              setIsReplyOpen(false);
            }}
          />
        </div>
      )}

      {comment.replyCount > 0 && variant === "comment" && (
        <div className="pl-14">
          <Button variant="tertiary" size="sm" onClick={() => setIsRepliesOpen((current) => !current)}>
            {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} replies
          </Button>
        </div>
      )}
    </div>
  );
}

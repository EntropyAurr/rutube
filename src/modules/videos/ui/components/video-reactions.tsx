import { useClerk } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { VideoGetOneOuput } from "../../types";
import { toast } from "sonner";

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOuput["viewerReaction"];
}

export function VideoReactions({ videoId, likes, dislikes, viewerReaction }: VideoReactionsProps) {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const like = trpc.videoReactions.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
    },

    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const dislike = trpc.videoReactions.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
    },

    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  return (
    <div className="flex flex-none items-center">
      <Button onClick={() => like.mutate({ videoId })} disabled={like.isPending || dislike.isPending} className="rouned-r-none gap-2 rounded-l-full pr-4" variant="secondary">
        <ThumbsUpIcon className={cn("size-5", viewerReaction === "like" && "fill-black")} />
        {likes}
      </Button>

      <Separator orientation="vertical" className="h-7" />

      <Button onClick={() => dislike.mutate({ videoId })} disabled={like.isPending || dislike.isPending} className="rouned-r-full rounded-l-none pl-3" variant="secondary">
        <ThumbsDownIcon className={cn("size-5", viewerReaction === "dislike" && "fill-black")} />
        {dislikes}
      </Button>
    </div>
  );
}

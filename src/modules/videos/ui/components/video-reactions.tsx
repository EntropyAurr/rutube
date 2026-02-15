import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

export function VideoReactions() {
  const viewerReaction: "like" | "dislike" = "like";

  return (
    <div className="flex flex-none items-center">
      <Button className="rouned-r-none gap-2 rounded-l-full pr-4" variant="secondary">
        <ThumbsUpIcon className={cn("size-5", viewerReaction === "like" && "fill-black")} />
        {1}
      </Button>

      <Separator orientation="vertical" className="h-7" />

      <Button className="rouned-r-full rounded-l-none pl-3" variant="secondary">
        <ThumbsDownIcon className={cn("size-5", viewerReaction !== "like" && "fill-black")} />
        {1}
      </Button>
    </div>
  );
}

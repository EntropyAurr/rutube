import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { VideoGetOneOuput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { UserInfo } from "@/modules/users/ui/components/user-info";

interface VideoOwnerProps {
  user: VideoGetOneOuput["user"];
  videoId: string;
}

export function VideoOwner({ user, videoId }: VideoOwnerProps) {
  const { userId: clerkUserId } = useAuth();

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 sm:items-start sm:justify-start">
      <Link href={`/users/${user.id}`}>
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />

          <div className="flex min-w-0 flex-col gap-1">
            <UserInfo size="lg" name={user.name} />
            <span className="line-clamp-1 text-sm text-muted-foreground">{0} subscribers</span>
          </div>
        </div>
      </Link>

      {clerkUserId === user.clerkId ? (
        <Button className="rounded-full" asChild variant="secondary">
          <Link href={`/studio/videos/${videoId}`}>Edit video</Link>
        </Button>
      ) : (
        <SubscriptionButton onClick={() => {}} disabled={false} isSubscribed={false} className="flex-none" />
      )}
    </div>
  );
}

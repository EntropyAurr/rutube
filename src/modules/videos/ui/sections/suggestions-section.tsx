"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton } from "../components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface SuggestionsSectionProps {
  videoId: string;
  isManual?: boolean;
}

export function SuggestionsSection({ videoId, isManual }: SuggestionsSectionProps) {
  return (
    <Suspense fallback={<SuggestionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error!</p>}>
        <SuggestionsSectionSuspense videoId={videoId} isManual={isManual} />
      </ErrorBoundary>
    </Suspense>
  );
}

function SuggestionsSectionSkeleton() {
  return (
    <>
      <div className="hidden space-y-3 md:block">
        {Array.from({ length: 8 }).map((_, index) => {
          return <VideoRowCardSkeleton key={index} size="compact" />;
        })}
      </div>

      <div className="block space-y-10 md:hidden">
        {Array.from({ length: 8 }).map((_, index) => {
          return <VideoGridCardSkeleton key={index} />;
        })}
      </div>
    </>
  );
}

function SuggestionsSectionSuspense({ videoId, isManual }: SuggestionsSectionProps) {
  const [suggestions, query] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({ videoId, limit: DEFAULT_LIMIT }, { getNextPageParam: (lastPage) => lastPage.nextCursor });

  return (
    <>
      <div className="hidden space-y-3 md:block">{suggestions.pages.flatMap((page) => page.items.map((video) => <VideoRowCard key={video.id} data={video} size="compact" />))}</div>

      <div className="block space-y-10 md:hidden">{suggestions.pages.flatMap((page) => page.items.map((video) => <VideoGridCard key={video.id} data={video} />))}</div>

      <InfiniteScroll isManual={isManual} hasNextPage={query.hasNextPage} isFetchingNextPage={query.isFetchingNextPage} fetchNextPage={query.fetchNextPage} />
    </>
  );
}

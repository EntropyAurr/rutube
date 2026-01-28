"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface FormSectionProps {
  videoId: string;
}

export function FormSection({ videoId }: FormSectionProps) {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SuspenseFormSection videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
}

function FormSectionSkeleton() {
  return <p>Loading...</p>;
}

function SuspenseFormSection({ videoId }: FormSectionProps) {
  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Video details</h1>
        <p className="text-sm text-muted-foreground">Manage your video details</p>
      </div>
    </div>
  );
}

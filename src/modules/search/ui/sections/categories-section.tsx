"use client";

import { FilterCarousel } from "@/components/filter-carousel";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface CategoriesSectionProps {
  categoryId?: string;
}

export function CategoriesSection({ categoryId }: CategoriesSectionProps) {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <ErrorBoundary fallback={<p>Error!!!</p>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
}

function CategoriesSkeleton() {
  return <FilterCarousel isLoading data={[]} onSelect={() => {}} />;
}

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const router = useRouter();
  const [categories] = trpc.categories.getMany.useSuspenseQuery(); // access the cached that has been stored in the server

  const data = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  function handleOnSelect(value: string | null) {
    const url = new URL(window.location.href);

    if (value) {
      url.searchParams.set("categoryId", value);
    } else {
      url.searchParams.delete("categoryId");
    }

    router.push(url.toString());
  }

  return <FilterCarousel value={categoryId} data={data} onSelect={handleOnSelect} />;
};

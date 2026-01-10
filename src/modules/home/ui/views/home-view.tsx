import { CategoriesSection } from "../sections/categories-section";

interface HomeViewProps {
  categoryId?: string;
}

export function HomeView({ categoryId }: HomeViewProps) {
  return (
    <div className="gap-y-6px-4 mx-auto mb-10 flex max-w-[2400px] flex-col pt-2.5">
      <CategoriesSection categoryId={categoryId} />
    </div>
  );
}

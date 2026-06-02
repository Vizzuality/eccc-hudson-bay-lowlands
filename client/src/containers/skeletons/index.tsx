import { Skeleton } from "@/components/ui/skeleton";

export const CategorySelectorSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4).keys()].map((num) => (
        <div
          key={`category-selector-skeleton-${num}`}
          className="bg-white/80 rounded-4xl p-6 space-y-2"
        >
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <Skeleton className="w-2/3 h-2.5" />
          <Skeleton className="w-1/2 h-2" />
        </div>
      ))}
    </div>
  );
};

export const DataLayersListSkeleton = () => {
  return (
    <section aria-label="Data layers list skeleton" className="space-y-5">
      <Skeleton className="h-3 w-16" />
      <div className="space-y-2">
        {[...Array(6).keys()].map((num) => (
          <div
            key={`data-layers-list-skeleton-${num}`}
            className="space-y-5 h-24"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

export const SharedAnalysisSkeleton = () => {
  return (
    <section className="flex h-full">
      <aside className="flex h-full min-h-0 flex-col w-[480px] min-[1440px]:w-[600px] pr-6">
        <CategorySelectorSkeleton />
        <DataLayersListSkeleton />
      </aside>
      <Skeleton className="h-full w-full" />
    </section>
  );
};

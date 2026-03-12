const Skeleton = () => (
  <div
    className="animate-pulse rounded-md bg-[var(--border)]/60  h-10 w-48 mb-2"
    aria-hidden="true"
  />
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <Skeleton className="h-10 w-24 mb-2" />
        <Skeleton className="h-10 w-16" />
      </div>
    ))}
  </div>
);

const FiltersSkeleton = () => (
  <div className="flex flex-wrap items-center gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-42 rounded-lg" />
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((__, j) => (
            <Skeleton key={j} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export { Skeleton, StatsSkeleton, FiltersSkeleton, TableSkeleton };

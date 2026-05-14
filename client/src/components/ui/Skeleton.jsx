export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-200/80 dark:bg-white/10 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

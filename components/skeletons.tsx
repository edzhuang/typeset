import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return <Skeleton className="w-[816px] h-[1056px] rounded-none" />;
}

export function DocumentSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="p-2">
        <PageSkeleton />
      </div>
      <div className="p-2">
        <PageSkeleton />
      </div>
    </div>
  );
}

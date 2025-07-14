import { Skeleton } from "@/components/ui/skeleton";

export function UserButtonSkeleton() {
  return <Skeleton className="size-8 rounded-full" />;
}

export function UserAccessRowSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export function UserAccessListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <UserAccessRowSkeleton />
      <UserAccessRowSkeleton />
      <UserAccessRowSkeleton />
    </div>
  );
}

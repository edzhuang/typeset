import { Skeleton } from "@/components/ui/skeleton";

export function UserButtonSkeleton() {
  return <Skeleton className="size-8 rounded-full" />;
}

export function UserAccessRowSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-[14px] w-[200px]" />
        <Skeleton className="h-[12px] w-[250px]" />
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

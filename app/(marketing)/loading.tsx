import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex justify-center">
                <div className="container flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4 px-4 md:px-8 lg:px-16">
                    <Skeleton className="h-12 w-64 mb-2" />
                    <Skeleton className="h-6 w-96" />
                    <div className="flex gap-2 pt-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center px-6 md:px-10 pb-6">
                <Skeleton className="w-full max-w-[1248px] aspect-video rounded-md" />
            </div>
        </div>
    );
}

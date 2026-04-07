import { ProjectsTableSkeleton } from "@/components/dashboard/projects-table-skeleton";
import { SiteHeader } from "@/components/dashboard/site-header";

export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <SiteHeader header="Shared With Me" />
      <div className="p-4 lg:p-6">
        <ProjectsTableSkeleton />
      </div>
    </div>
  );
}

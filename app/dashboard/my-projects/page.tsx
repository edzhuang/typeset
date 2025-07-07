import { SiteHeader } from "@/components/site-header";

export default async function Page() {
  return (
    <div className="flex flex-col h-full">
      <SiteHeader header="My Projects" />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"></div>
      </div>
    </div>
  );
}

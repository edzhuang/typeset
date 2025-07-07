import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export default async function Page() {
  const client = await clerkClient();
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const { data: rooms } = await liveblocks.getRooms({
    userId: userId,
    query: {
      metadata: {
        ownerId: userId,
      },
    },
  });

  const data = await Promise.all(
    rooms.map(async (room, index: number) => {
      const lastOpened = room.lastConnectionAt
        ? room.lastConnectionAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "None";
      const metadata = room.metadata;
      const owner = await client.users.getUser(metadata.ownerId as string);

      return {
        id: index,
        projectId: room.id,
        title: metadata.title as string,
        owner: owner.fullName || owner.id || "Unknown User",
        lastOpened: lastOpened,
      };
    })
  );

  return (
    <div className="flex flex-col h-full">
      <SiteHeader header="My Projects" />
      <div className="flex flex-1 flex-col">
        {data.length ? (
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable data={data} />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center items-center gap-2">
            <div className="text-muted-foreground">No projects created</div>
          </div>
        )}
      </div>
    </div>
  );
}

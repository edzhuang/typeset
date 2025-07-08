import { columns, Project } from "@/components/dashboard/my-projects/columns";
import { SiteHeader } from "@/components/dashboard/site-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Liveblocks } from "@liveblocks/node";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

async function getData(): Promise<Project[]> {
  const client = await clerkClient();
  const { userId } = await auth();

  if (!userId) return [];

  const { data: rooms } = await liveblocks.getRooms({
    userId: userId,
    query: {
      metadata: {
        ownerId: userId,
      },
    },
  });

  const data = Promise.all(
    rooms.map(async (room) => {
      const metadata = room.metadata;
      const owner = await client.users.getUser(metadata.ownerId as string);

      return {
        id: room.id,
        title: metadata.title as string,
        owner: owner.fullName || "",
        lastOpened: room.lastConnectionAt || null,
      };
    })
  );

  return data;
}

export default async function Page() {
  const data = await getData();

  return (
    <div className="flex flex-col h-full">
      <SiteHeader header="My Projects" />
      <div className="p-4 lg:p-6">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}

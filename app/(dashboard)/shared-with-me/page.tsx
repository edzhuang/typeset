import { columns, Project } from "@/components/dashboard/my-projects/columns";
import { SiteHeader } from "@/components/dashboard/site-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

async function getData(): Promise<Project[]> {
  const user = await currentUser();
  if (!user || !user.primaryEmailAddress) return [];
  const email = user.primaryEmailAddress.emailAddress;

  const { data: rooms } = await liveblocks.getRooms({
    userId: email,
  });

  const filteredRooms = rooms.filter((room) => room.metadata.ownerId !== email);

  const data = Promise.all(
    filteredRooms.map(async (room) => {
      const metadata = room.metadata;

      return {
        id: room.id,
        title: metadata.title as string,
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
      <SiteHeader header="Shared With Me" />
      <div className="p-4 lg:p-6">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}

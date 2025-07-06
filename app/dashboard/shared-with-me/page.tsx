import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

interface Room {
  id: string;
  metadata: {
    title: string;
    ownerId: string;
    lastEdited: string;
  };
}

function formatISODate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Page() {
  const client = await clerkClient();
  const { userId } = await auth();

  const metadata = `userId=${userId}&metadata.ownerId=!${userId}`;
  const url = `https://api.liveblocks.io/v2/rooms?${metadata}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
    },
  });
  const res = await response.json();
  const data = await Promise.all(
    res.data.map(async (room: Room, index: number) => {
      const metadata = room.metadata;
      const owner = await client.users.getUser(metadata.ownerId);

      return {
        id: index,
        projectId: room.id,
        title: metadata.title,
        owner: owner.fullName || owner.id,
        lastEdited: formatISODate(metadata.lastEdited),
      };
    })
  );

  return (
    <div>
      <SiteHeader header="Shared With Me" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

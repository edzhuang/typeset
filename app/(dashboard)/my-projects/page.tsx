import { columns, Project } from "@/components/dashboard/my-projects/columns";
import { SiteHeader } from "@/components/dashboard/site-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Liveblocks } from "@liveblocks/node";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

async function getData(): Promise<Project[]> {
  const user = await currentUser();
  if (!user || !user.primaryEmailAddress) return [];
  const email = user.primaryEmailAddress.emailAddress;

  const { data: rooms } = await liveblocks.getRooms({
    userId: email,
    query: {
      metadata: {
        ownerId: email,
      },
    },
  });

  // Extract unique owner emails
  const ownerEmails = Array.from(
    new Set(
      rooms.map((room) => room.metadata.ownerId as string).filter(Boolean)
    )
  );

  // Fetch user info from Clerk
  const emailToName = new Map<string, string>();
  if (ownerEmails.length > 0) {
    const clerk = await clerkClient();
    const { data: users } = await clerk.users.getUserList({
      emailAddress: ownerEmails,
    });
    for (const user of users) {
      if (user.primaryEmailAddress) {
        const primaryEmail = user.primaryEmailAddress.emailAddress;
        emailToName.set(primaryEmail, user.fullName || primaryEmail);
      }
    }
  }

  const data = await Promise.all(
    rooms.map(async (room) => {
      const metadata = room.metadata;
      const ownerEmail = metadata.ownerId as string;
      return {
        id: room.id,
        title: metadata.title as string,
        owner: emailToName.get(ownerEmail) || ownerEmail,
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

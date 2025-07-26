import { Providers } from "@/components/project/providers";
import { CollaborativeEditor } from "@/components/project/collaborative-editor";
import { liveblocks } from "@/lib/liveblocks";
import { RoomData } from "@liveblocks/node";
import { UserAccessInfo } from "@/types/user-access";
import { clerkClient, User } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

const getTitle = async (room: RoomData) => {
  return room.metadata.title as string;
};

const getUserAccessInfo = async (room: RoomData): Promise<UserAccessInfo[]> => {
  const emails = Object.keys(room.usersAccesses);
  const clerk = await clerkClient();

  const { data: users } = await clerk.users.getUserList({
    emailAddress: emails,
  });

  const emailToUser = new Map<string, User>();
  for (const user of users) {
    if (user.primaryEmailAddress) {
      const primaryEmail = user.primaryEmailAddress.emailAddress;
      emailToUser.set(primaryEmail, user);
    }
  }

  const userAccessInfo: UserAccessInfo[] = emails.map((email) => {
    const user = emailToUser.get(email);
    const roomAccess = room.usersAccesses[email]!;

    let access: "owner" | "can edit" | "can view";
    if (email === room.metadata.ownerId) {
      access = "owner";
    } else if (roomAccess.length === 1 && roomAccess[0] === "room:write") {
      access = "can edit";
    } else {
      access = "can view";
    }

    return {
      imageUrl: user?.imageUrl ?? null,
      name: user?.fullName ?? null,
      email,
      access,
    };
  });

  // Sort so that the owner's email comes first
  userAccessInfo.sort((a, b) => {
    if (a.access === "owner") return -1;
    if (b.access === "owner") return 1;
    return 0;
  });

  return userAccessInfo;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const room = await liveblocks.getRoom(id);
    const title = getTitle(room);
    const userAccessInfo = getUserAccessInfo(room);

    return (
      <Providers id={id}>
        <CollaborativeEditor title={title} userAccessInfo={userAccessInfo} />
      </Providers>
    );
  } catch {
    notFound();
  }
}

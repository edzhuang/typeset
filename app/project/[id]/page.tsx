import { Providers } from "@/components/project/providers";
import Editor from "@/components/project/editor";
import { Liveblocks } from "@liveblocks/node";
import { clerkClient } from "@clerk/nextjs/server";
import { type UserAccessRowProps } from "@/components/project/user-access-row";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roomData = await liveblocks.getRoom(id);
  const title = roomData.metadata.title as string;
  const ownerId = roomData.metadata.ownerId as string;
  const clerk = await clerkClient();
  const usersInfo = await Promise.all(
    Object.entries(roomData.usersAccesses).map(async ([userId]) => {
      const info: UserAccessRowProps = {
        imageUrl: null,
        name: null,
        email: userId,
        access: "can edit",
      };

      const { data, totalCount } = await clerk.users.getUserList({
        emailAddress: [userId],
      });

      if (totalCount > 0) {
        const user = data[0];
        info.imageUrl = user.imageUrl;
        info.name = user.fullName;
      }

      if (userId === ownerId) {
        info.access = "owner";
      } else {
        info.access = "can edit";
      }

      return info;
    })
  );

  return (
    <Providers id={id}>
      <Editor title={title} usersInfo={usersInfo} />
    </Providers>
  );
}

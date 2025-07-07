"use server";

import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function createProject(title: string) {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const projectId = nanoid();

  await liveblocks.createRoom(projectId, {
    defaultAccesses: [],
    usersAccesses: {
      [userId]: ["room:write"],
    },
    metadata: {
      title,
      ownerId: userId,
    },
  });

  redirect(`/project/${projectId}`);
}

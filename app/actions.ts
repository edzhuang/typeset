"use server";

import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/dashboard/my-projects");
  redirect(`/project/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await liveblocks.deleteRoom(projectId);
  revalidatePath("/dashboard/my-projects");
}

export async function leaveProject(projectId: string) {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  await liveblocks.updateRoom(projectId, {
    usersAccesses: {
      [userId]: null,
    },
  });

  revalidatePath("/dashboard/shared-with-me");
}

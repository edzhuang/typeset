"use server";

import { z } from "zod";
import { projectFormSchema } from "@/lib/schemas";
import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function createProject(values: z.infer<typeof projectFormSchema>) {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const projectId = nanoid();
  const date = new Date().toISOString();

  await liveblocks.createRoom(projectId, {
    defaultAccesses: [],
    usersAccesses: {
      [userId]: ["room:write"],
    },
    metadata: {
      title: values.title,
      ownerId: userId,
      lastEdited: date,
    },
  });

  redirect(`/project/${projectId}`);
}

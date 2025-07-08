"use server";

import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import * as Y from "yjs";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function createProject(title: string) {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const projectId = nanoid();
  const yDoc = new Y.Doc();
  const yText = yDoc.getText("codemirror");

  // Add default template
  const templatePath = path.join(process.cwd(), "docs", "latex-template.tex");
  const template = await fs.readFile(templatePath, "utf-8");
  yText.insert(0, template);
  const yUpdate = Y.encodeStateAsUpdate(yDoc);

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

  // Initialize the Yjs document with the update
  await liveblocks.sendYjsBinaryUpdate(projectId, yUpdate);

  revalidatePath("/dashboard/my-projects");
  redirect(`/project/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await liveblocks.deleteRoom(projectId);
  revalidatePath("/dashboard/my-projects");
}

export async function removeSharedProject(projectId: string) {
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

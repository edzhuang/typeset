"use server";

import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import * as Y from "yjs";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Helper function to generate LaTeX template
function generateLatexTemplate(title: string, author: string): string {
  return [
    "\\documentclass{article}",
    `\\title{${title}}`,
    `\\author{${author}}`,
    "\\date{\\today}",
    "",
    "\\begin{document}",
    "",
    "\\maketitle",
    "",
    "\\section{Section}",
    "",
    "\\end{document}",
  ].join("\n");
}

export async function createProject(title: string) {
  const user = await currentUser();
  if (!user) return;

  const email = user.emailAddresses[0].emailAddress;

  const projectId = nanoid();
  const yDoc = new Y.Doc();
  const yText = yDoc.getText("codemirror");

  // Add default template
  const template = generateLatexTemplate(title, user.fullName || "Author");

  yText.insert(0, template);
  const yUpdate = Y.encodeStateAsUpdate(yDoc);

  await liveblocks.createRoom(projectId, {
    defaultAccesses: [],
    usersAccesses: {
      [email]: ["room:write"],
    },
    metadata: {
      title,
      ownerId: email,
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

export async function leaveProject(projectId: string) {
  const user = await currentUser();
  if (!user) return;

  const email = user.emailAddresses[0].emailAddress;

  await liveblocks.updateRoom(projectId, {
    usersAccesses: {
      [email]: null,
    },
  });

  revalidatePath("/dashboard/shared-with-me");
}

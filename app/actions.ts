"use server";

import { liveblocks } from "@/lib/liveblocks";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import * as Y from "yjs";

function generateLatexTemplate(author: string): string {
  return [
    "\\documentclass{article}",
    `\\title{Untitled Project}`,
    `\\author{${author}}`,
    "\\date{\\today}",
    "",
    "\\begin{document}",
    "",
    "\\maketitle",
    "",
    "\\section{Section}",
    "",
    "Text",
    "",
    "\\end{document}",
  ].join("\n");
}

export async function createProject() {
  const user = await currentUser();
  if (!user || !user.primaryEmailAddress) return;
  const email = user.primaryEmailAddress.emailAddress;

  const projectId = nanoid();
  const yDoc = new Y.Doc();
  const yText = yDoc.getText("codemirror");

  // Add default template
  const template = generateLatexTemplate(user.fullName || "Author");

  yText.insert(0, template);
  const yUpdate = Y.encodeStateAsUpdate(yDoc);

  await liveblocks.createRoom(projectId, {
    defaultAccesses: [],
    usersAccesses: {
      [email]: ["room:write"],
    },
    metadata: {
      title: "Untitled Project",
      ownerId: email,
    },
  });

  // Initialize the Yjs document with the update
  await liveblocks.sendYjsBinaryUpdate(projectId, yUpdate);

  revalidatePath("/my-projects");
  redirect(`/project/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await liveblocks.deleteRoom(projectId);
  revalidatePath("/my-projects");
}

export async function leaveProject(projectId: string) {
  const user = await currentUser();
  if (!user || !user.primaryEmailAddress) return;
  const email = user.primaryEmailAddress.emailAddress;

  await liveblocks.updateRoom(projectId, {
    usersAccesses: {
      [email]: null,
    },
  });

  revalidatePath("/shared-with-me");
}

export async function renameProject(projectId: string, newTitle: string) {
  if (newTitle.length == 0 || newTitle.length > 60) {
    return;
  }

  await liveblocks.updateRoom(projectId, {
    metadata: {
      title: newTitle,
    },
  });

  revalidatePath("/my-projects");
  revalidatePath("/shared-with-me");
  revalidatePath(`/project/${projectId}`);
}

export async function inviteToProject(projectId: string, email: string) {
  await liveblocks.updateRoom(projectId, {
    usersAccesses: {
      [email]: ["room:write"],
    },
  });

  revalidatePath(`/project/${projectId}`);
}

export async function removeFromProject(projectId: string, email: string) {
  await liveblocks.updateRoom(projectId, {
    usersAccesses: {
      [email]: null,
    },
  });

  revalidatePath(`/project/${projectId}`);
}

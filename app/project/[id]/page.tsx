"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import Editor from "@/components/editor";
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();

  return (
    <LiveblocksProvider
      publicApiKey={
        "pk_dev_3gfS1lx2gjMjPtEOIp7IgGL87dTOcwk44sLj_oRhOOxj69yGsRqlz7o7XZ5sfWi3"
      }
    >
      <RoomProvider id={params.id}>
        <Editor />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import Editor from "@/components/editor";
import { useParams } from "next/navigation";
import { ClientSideSuspense } from "@liveblocks/react/suspense";

export default function Page() {
  const params = useParams<{ id: string }>();

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={params.id}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          <Editor />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

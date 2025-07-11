"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LoaderCircle } from "lucide-react";

export function Providers({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={id}>
        <ClientSideSuspense
          fallback={
            <div className="h-screen flex flex-col justify-center items-center">
              <LoaderCircle className="size-28 animate-spin" />
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

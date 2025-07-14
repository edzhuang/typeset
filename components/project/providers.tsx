"use client";

import React, { useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useErrorListener,
} from "@liveblocks/react/suspense";
import { LoaderCircle } from "lucide-react";

function LiveblocksErrorHandler({ onError }: { onError: () => void }) {
  useErrorListener(() => {
    onError();
  });
  return null;
}

export function Providers({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="h-screen flex flex-col justify-center items-center text-center">
        <h1 className="text-6xl font-semibold">404</h1>
      </div>
    );
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <LiveblocksErrorHandler onError={() => setError(true)} />
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

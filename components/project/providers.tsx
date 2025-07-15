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
        <div className="flex flex-col gap-4 p-6">
          <h1 className="text-3xl font-semibold mb-2">
            You don&apos;t have access to this project
          </h1>
          <p className="text-gray-500 mb-4">
            If you believe this is a mistake, please contact the project owner
            or try accessing a different project.
          </p>
        </div>
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
              <LoaderCircle className="size-24 animate-spin" />
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

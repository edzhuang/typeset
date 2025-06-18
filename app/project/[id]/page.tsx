"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
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
        <div className="h-full px-2 pb-2">
          <ResizablePanelGroup direction="horizontal" autoSaveId="editor">
            <ResizablePanel defaultSize={20}>
              <Card className="h-full">Chat</Card>
            </ResizablePanel>

            <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

            <ResizablePanel defaultSize={40}>
              <Card className="h-full">
                <ClientSideSuspense fallback={<div>Loading…</div>}>
                  <Editor />
                </ClientSideSuspense>
              </Card>
            </ResizablePanel>

            <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

            <ResizablePanel defaultSize={40}>
              <Card className="h-full">Preview</Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

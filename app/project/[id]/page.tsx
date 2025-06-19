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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { useState } from "react";

export default function ProjectPage() {
  const [editorContent, setEditorContent] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const params = useParams<{ id: string }>();

  const compile = async () => {
    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editorContent }),
    });

    // Turn the binary payload into a Blob URL
    const blob = await res.blob();
    const namedBlob = new Blob([blob], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(namedBlob);
    setPdfUrl(url);
  };

  return (
    <LiveblocksProvider
      publicApiKey={
        "pk_dev_3gfS1lx2gjMjPtEOIp7IgGL87dTOcwk44sLj_oRhOOxj69yGsRqlz7o7XZ5sfWi3"
      }
    >
      <RoomProvider id={params.id}>
        <div className="flex flex-col h-screen">
          <NavigationMenu className="p-2">
            <div className="flex w-screen justify-between">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink>Link</NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>

              <NavigationMenuList>
                <NavigationMenuItem>
                  <Button onClick={compile}>
                    <IconPlayerPlayFilled /> Compile
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>

              <NavigationMenuList></NavigationMenuList>
            </div>
          </NavigationMenu>

          <div className="h-full px-2 pb-2">
            <ResizablePanelGroup direction="horizontal" autoSaveId="editor">
              <ResizablePanel defaultSize={20}>
                <Card className="h-full">Chat</Card>
              </ResizablePanel>

              <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

              <ResizablePanel defaultSize={40}>
                <Card className="h-full">
                  <ClientSideSuspense fallback={<div>Loading…</div>}>
                    <Editor setEditorContent={setEditorContent} />
                  </ClientSideSuspense>
                </Card>
              </ResizablePanel>

              <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

              <ResizablePanel defaultSize={40}>
                <Card className="h-full p-0 overflow-hidden">
                  {pdfUrl && (
                    <iframe
                      src={pdfUrl}
                      title="PDF preview"
                      className="h-full"
                    />
                  )}
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

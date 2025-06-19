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
import { Play } from "lucide-react";
import { useState } from "react";
import { PDFViewer } from "@/components/pdf-viewer";

export default function ProjectPage() {
  const [editorContent, setEditorContent] = useState("");
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const params = useParams<{ id: string }>();

  const compile = async () => {
    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editorContent }),
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      setPdfData(arrayBuffer);
    }
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
                    <Play /> Compile
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>

              <NavigationMenuList></NavigationMenuList>
            </div>
          </NavigationMenu>

          <ResizablePanelGroup
            className="px-2 pb-2"
            direction="horizontal"
            autoSaveId="editor"
          >
            <ResizablePanel defaultSize={20}>
              <Card className="h-full">Chat</Card>
            </ResizablePanel>
            <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />
            <ResizablePanel defaultSize={40}>
              <Card className="h-full p-0 overflow-hidden">
                <ClientSideSuspense fallback={<div>Loading…</div>}>
                  <Editor
                    setEditorContent={setEditorContent}
                    className="h-full"
                  />
                </ClientSideSuspense>
              </Card>
            </ResizablePanel>
            <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />{" "}
            <ResizablePanel defaultSize={40}>
              <Card className="h-full p-0 overflow-hidden">
                {pdfData && <PDFViewer pdfData={pdfData} className="h-full" />}
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

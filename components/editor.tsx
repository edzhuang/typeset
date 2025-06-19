"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
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
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { useCallback, useEffect, useState } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";

export default function Editor() {
  const room = useRoom();
  const yProvider = getYjsProviderForRoom(room);
  const [element, setElement] = useState<HTMLElement>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setElement(node);
  }, []);

  // Set up Liveblocks Yjs provider and attach CodeMirror editor
  useEffect(() => {
    if (!element || !room) {
      return;
    }

    // Get document
    const yDoc = yProvider.getYDoc();
    const yText = yDoc.getText("codemirror");
    const undoManager = new Y.UndoManager(yText);

    // Set up CodeMirror and extensions
    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        javascript(),
        yCollab(yText, yProvider.awareness, { undoManager }),
      ],
    });

    // Attach CodeMirror to element
    const view = new EditorView({
      state,
      parent: element,
    });

    return () => {
      view?.destroy();
    };
  }, [element, room, yProvider]);

  const compile = async () => {
    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: yProvider.getYDoc().getText("codemirror").toString(),
      }),
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
            <div ref={ref} />
          </Card>
        </ResizablePanel>
        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />{" "}
        <ResizablePanel defaultSize={40}>
          <Card className="h-full p-0 overflow-hidden">
            {pdfUrl && <iframe src={pdfUrl} title="PDF" className="h-full" />}
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

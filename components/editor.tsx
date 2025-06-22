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
import { yCollab } from "y-codemirror.next";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { defaultKeymap, insertTab } from "@codemirror/commands";
import { keymap, EditorView } from "@codemirror/view";
import { useCallback, useEffect, useState } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";
import { ScrollArea } from "@/components/ui/scroll-area";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "next-themes";
import { PdfViewer } from "@/components/pdf-viewer";
import { pdfjs } from "react-pdf";
import { defaultTemplate } from "@/lib/templates";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function Editor() {
  const room = useRoom();
  const yProvider = getYjsProviderForRoom(room);
  const [element, setElement] = useState<HTMLElement>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

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
    
    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        EditorView.theme({
          "&": {
            backgroundColor: "hsl(var(--card))",
          },
          ".cm-gutters": {
            backgroundColor: "hsl(var(--muted))",
          },
        }),
        resolvedTheme === "dark" ? githubDark : githubLight,
        EditorView.lineWrapping,
        latex(),
        yCollab(yText, yProvider.awareness),
        keymap.of([...defaultKeymap, { key: "Tab", run: insertTab }]),
      ],
    });

    // Attach CodeMirror to element
    const view = new EditorView({
      state,
      parent: element,
    });

    // Set default template when the provider is synced
    const handleSync = () => {
      const hasInitialized = yDoc.getMap("meta").get("initialized");
      if (yText.toString().length === 0 && !hasInitialized) {
        yText.insert(0, defaultTemplate);
        yDoc.getMap("meta").set("initialized", true);
      }
    };

    if (yProvider.synced) {
      handleSync();
    }

    yProvider.on("sync", (isSynced: boolean) => {
      if (isSynced === true) {
        handleSync();
      }
    });
    
    return () => {
      view?.destroy();
    };
  }, [element, room, yProvider, resolvedTheme]);

  const compile = async () => {
    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: yProvider.getYDoc().getText("codemirror").toString(),
      }),
    });

    if (!res.ok) {
      console.error("Failed to compile:", res.statusText);
      return;
    }

    const pdfBlob = await res.blob();
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    const newPdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(newPdfUrl);
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
            <ScrollArea className="overflow-auto">
              <div ref={ref} />
            </ScrollArea>
          </Card>
        </ResizablePanel>
        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />
        <ResizablePanel defaultSize={40}>
          <Card className="h-full p-0 overflow-hidden">
            {pdfUrl && <PdfViewer file={pdfUrl} />}
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

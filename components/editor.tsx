"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Play, House, UserPlus } from "lucide-react";
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
import { Chat } from "@/components/chat";
import { UserButton } from "@clerk/nextjs";

export default function Editor() {
  const room = useRoom();
  const { resolvedTheme } = useTheme();
  const yProvider = getYjsProviderForRoom(room);
  const [editor, setEditor] = useState<HTMLElement>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [, setOldFile] = useState<string | null>(null);

  const editorRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setEditor(node);
  }, []);

  async function fetchLatexTemplate(): Promise<string> {
    const res = await fetch("/latex-template.tex");
    if (!res.ok) throw new Error("Failed to load template");
    return res.text();
  }

  // Set up Liveblocks Yjs provider and attach CodeMirror editor
  useEffect(() => {
    if (!editor || !room) {
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
      parent: editor,
    });

    // Set default template when the provider is synced
    const handleSync = async () => {
      const hasInitialized = yDoc.getMap("meta").get("initialized");
      if (!hasInitialized) {
        const template = await fetchLatexTemplate();
        yText.insert(0, template);
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
  }, [editor, room, yProvider, resolvedTheme]);

  // Handle changes to the old file
  useEffect(() => {
    const yMap = yProvider.getYDoc().getMap("files");
    const handleChange = () => {
      const file = yMap.get("oldFile");
      setOldFile(typeof file === "string" ? file : null);
    };
    yMap.observe(handleChange);
    handleChange();
    return () => yMap.unobserve(handleChange);
  });

  /**
   * Compiles the current LaTeX content to PDF and updates the PDF viewer
   * @returns {Promise<void>} A promise that resolves when compilation is complete
   */
  const compile = async () => {
    const content = yProvider.getYDoc().getText("codemirror").toString();

    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
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
              <Button variant="ghost" size="icon">
                <House />
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>

          <NavigationMenuList>
            <NavigationMenuItem>
              <Button onClick={compile}>
                <Play /> Compile
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>

          <NavigationMenuList>
            <NavigationMenuItem>
              <Button variant="secondary">
                <UserPlus /> Invite
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem className="flex p-1">
              <UserButton />
            </NavigationMenuItem>
          </NavigationMenuList>
        </div>
      </NavigationMenu>

      <ResizablePanelGroup
        className="px-2 pb-2"
        direction="horizontal"
        autoSaveId="editor"
      >
        <ResizablePanel defaultSize={20}>
          <Card className="h-full p-0 overflow-hidden">
            <Chat yProvider={yProvider} />
          </Card>
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <Card className="h-full p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={editorRef} />
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

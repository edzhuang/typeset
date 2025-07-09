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
import { Play, House, UserPlus, Loader2Icon } from "lucide-react";
import { yCollab } from "y-codemirror.next";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { defaultKeymap, insertTab } from "@codemirror/commands";
import { keymap, EditorView } from "@codemirror/view";
import { useCallback, useEffect, useState, useRef } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "next-themes";
import { PdfViewer } from "@/components/project/pdf-viewer";
import { Chat } from "@/components/project/chat";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { dark } from "@clerk/themes";
import { useActionState, startTransition } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Editor() {
  const room = useRoom();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const yProvider = getYjsProviderForRoom(room);
  const [editor, setEditor] = useState<HTMLElement>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [, setOldFile] = useState<string | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const editorRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setEditor(node);
  }, []);

  // Calculate card height using ResizeObserver
  useEffect(() => {
    if (!cardRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        setCardHeight(height);
      }
    });

    resizeObserver.observe(cardRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
          ".cm-content, .cm-gutter": { minHeight: `${cardHeight}px` },
          ".cm-gutters": {
            backgroundColor: "hsl(var(--muted))",
            border: "none",
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

    return () => {
      view?.destroy();
    };
  }, [editor, room, yProvider, resolvedTheme, cardHeight]);

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
  const [, action, pending] = useActionState(compile, undefined);

  return (
    <div className="flex flex-col h-screen">
      <NavigationMenu className="p-2">
        <div className="flex w-screen justify-between">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                size="icon"
              >
                <House />
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>

          <NavigationMenuList>
            <NavigationMenuItem>
              <Button
                onClick={() => startTransition(action)}
                disabled={pending}
              >
                {pending ? <Loader2Icon className="animate-spin" /> : <Play />}
                Compile
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
              <UserButton
                appearance={{
                  baseTheme: resolvedTheme === "dark" ? dark : undefined,
                }}
              />
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
          <Card ref={cardRef} className="h-full p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="h-full" ref={editorRef} />
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

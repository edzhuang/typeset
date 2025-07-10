"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Play,
  House,
  UserPlus,
  Loader2Icon,
  SendHorizontal,
} from "lucide-react";
import { yCollab } from "y-codemirror.next";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { defaultKeymap, insertTab } from "@codemirror/commands";
import { keymap, EditorView } from "@codemirror/view";
import { useCallback, useEffect, useState, useRef } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "next-themes";
import { PdfViewer } from "@/components/project/pdf-viewer";
import { Chat } from "@/components/project/chat";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { dark } from "@clerk/themes";
import { useActionState, startTransition } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserInfo } from "@/liveblocks.config";
import { Avatars } from "@/components/project/avatars";

export default function Editor() {
  const room = useRoom();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const yProvider = getYjsProviderForRoom(room);
  const [editor, setEditor] = useState<HTMLElement>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [, setOldFile] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get user info from Liveblocks authentication endpoint
  const userInfo = useSelf((me) => me.info) as UserInfo;

  const editorRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setEditor(node);
  }, []);

  // Calculate card height using ResizeObserver
  useEffect(() => {
    if (!panelRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        setPanelHeight(height);
      }
    });

    resizeObserver.observe(panelRef.current);

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

    // Attach user info to Yjs
    yProvider.awareness.setLocalStateField("user", {
      name: userInfo.name,
      color: userInfo.color,
      colorLight: userInfo.color + "80", // 6-digit hex code at 50% opacity
    });

    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        EditorView.theme({
          "&": {
            backgroundColor: "transparent",
          },
          ".cm-content": {
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
            minHeight: `${panelHeight}px`,
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
          },
          ".cm-gutter": {
            minHeight: `${panelHeight}px`,
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--muted-foreground)",
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            border: "none",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            paddingLeft: "1rem !important",
          },
          ".cm-foldGutter .cm-gutterElement": {
            paddingRight: ".25rem !important",
          },
          ".cm-foldPlaceholder": {
            borderColor: "var(--border)",
            backgroundColor: "var(--editor-panel)",
            color: "var(--muted-foreground)",
          },
          ".cm-ySelectionInfo": {
            position: "absolute",
            top: "-1.6em",
            left: "-1px",
            padding: "2px 6px",
            opacity: 1,
            color: "#fff",
            border: 0,
            borderRadius: "6px",
            borderBottomLeftRadius: 0,
            lineHeight: "normal",
            whiteSpace: "nowrap",
            fontSize: "14px",
            fontFamily: "var(--font-sans)",
            fontStyle: "normal",
            fontWeight: 600,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1000,
          },
          ".cm-ySelectionCaretDot": {
            display: "none",
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
  }, [editor, room, yProvider, resolvedTheme, panelHeight, userInfo]);

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
    <div className="flex flex-col h-screen bg-editor">
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

          <NavigationMenuList className="gap-2">
            <NavigationMenuItem className="mx-4">
              <Avatars />
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Dialog>
                <form>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <UserPlus /> Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite</DialogTitle>
                      <DialogDescription className="sr-only">
                        Invite users to collaborate on your project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex w-full items-center gap-2">
                      <Input type="email" placeholder="Email address" />
                      <Button type="submit" size="icon">
                        <SendHorizontal />
                      </Button>
                    </div>
                  </DialogContent>
                </form>
              </Dialog>
            </NavigationMenuItem>
            <NavigationMenuItem className="flex flex-1 item-center">
              <UserButton
                appearance={{
                  baseTheme: resolvedTheme === "dark" ? dark : undefined,
                  elements: {
                    avatarBox: "size-8!",
                  },
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
          <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border">
            <Chat yProvider={yProvider} />
          </div>
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <div
            ref={panelRef}
            className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border"
          >
            <ScrollArea className="h-full">
              <div className="h-full" ref={editorRef} />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border">
            {pdfUrl && <PdfViewer file={pdfUrl} />}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, House, UserPlus, Loader2Icon, FileText } from "lucide-react";
import { yCollab } from "y-codemirror.next";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { defaultKeymap, insertTab } from "@codemirror/commands";
import { keymap, EditorView } from "@codemirror/view";
import {
  use,
  useCallback,
  useEffect,
  useState,
  useActionState,
  startTransition,
} from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import {
  ClientSideSuspense,
  useRoom,
  useSelf,
} from "@liveblocks/react/suspense";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "next-themes";
import { PdfViewer } from "@/components/project/pdf-viewer";
import { Chat } from "@/components/project/chat";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { dark } from "@clerk/themes";
import { UserInfo } from "@/liveblocks.config";
import { Avatars } from "@/components/project/avatars";
import { renameProject } from "@/app/actions";
import {
  UserAccessListSkeleton,
  UserButtonSkeleton,
} from "@/components/project/skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { UserAccessList } from "@/components/project/user-access-list";
import { inviteToProject } from "@/app/actions";
import { UserAccessInfo } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formSchema = z.object({
  email: z.string().email(),
});

export default function Editor({
  title,
  userAccessInfo,
}: {
  title: Promise<string>;
  userAccessInfo: Promise<UserAccessInfo[]>;
}) {
  const room = useRoom();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const projectTitle = use(title);
  const yProvider = getYjsProviderForRoom(room);
  const [editor, setEditor] = useState<HTMLElement>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [, setOldFile] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState(projectTitle);

  const inviteForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmitInvite(values: z.infer<typeof formSchema>) {
    const email = values.email;
    inviteToProject(room.id, email);
    inviteForm.reset();
  }

  // Get user info from Liveblocks authentication endpoint
  const userInfo = useSelf((me) => me.info) as UserInfo;

  const editorRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setEditor(node);
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
            height: "100%",
          },
          ".cm-scroller": {
            overflow: "auto",
          },
          ".cm-content": {
            paddingTop: "1rem",
            paddingBottom: "1rem",
            fontSize: "14px",
            fontFamily: "var(--font-mono)",
          },
          ".cm-gutter": {
            fontSize: "14px",
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-mono)",
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
  }, [editor, room, yProvider, resolvedTheme, userInfo]);

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
    <div className="flex flex-col h-screen bg-editor text-sm">
      <NavigationMenu className="p-2">
        <div className="grid w-screen grid-cols-[1fr_auto_1fr]">
          <div className="flex">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Button
                  onClick={() => router.push("/my-projects")}
                  variant="ghost"
                  size="icon"
                >
                  <House />
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Popover
                  onOpenChange={(open) => {
                    if (!open) {
                      const newTitle = titleInput.trim();
                      if (
                        newTitle.length > 0 &&
                        newTitle.length <= 60 &&
                        newTitle !== projectTitle
                      ) {
                        renameProject(room.id, newTitle);
                      } else {
                        setTitleInput(projectTitle);
                      }
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="ghost">{projectTitle}</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Input
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                    />
                  </PopoverContent>
                </Popover>
              </NavigationMenuItem>
            </NavigationMenuList>
          </div>
          <div className="justify-self-center">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Button
                  onClick={() => startTransition(action)}
                  disabled={pending}
                >
                  {pending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <Play />
                  )}
                  Compile
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </div>
          <div className="flex justify-end">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem className="mx-4">
                <Avatars />
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <UserPlus /> Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite people</DialogTitle>
                      <DialogDescription>
                        Invite your team members to collaborate.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-6">
                      <Form {...inviteForm}>
                        <form
                          onSubmit={inviteForm.handleSubmit(onSubmitInvite)}
                        >
                          <FormField
                            control={inviteForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="grow">
                                <div className="flex w-full items-center gap-2">
                                  <FormControl>
                                    <Input
                                      placeholder="Email address"
                                      {...field}
                                    />
                                  </FormControl>

                                  <Button type="submit">Invite</Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                      <ClientSideSuspense fallback={<UserAccessListSkeleton />}>
                        <UserAccessList
                          projectId={room.id}
                          userAccessInfo={userAccessInfo}
                        />
                      </ClientSideSuspense>
                    </div>
                  </DialogContent>
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
                  fallback={<UserButtonSkeleton />}
                />
              </NavigationMenuItem>
            </NavigationMenuList>
          </div>
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
          <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border">
            <div className="h-full" ref={editorRef} />
          </div>
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border">
            {pdfUrl ? (
              <PdfViewer file={pdfUrl} />
            ) : (
              <div className="flex flex-col grow justify-center items-center">
                <div className="flex flex-col  justify-center items-center p-4 gap-4 text-center">
                  <FileText className="size-10" />
                  <h1 className="text-lg">Preview your document here</h1>
                  <p className="text-muted-foreground text-sm">
                    Compile to see the output PDF
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

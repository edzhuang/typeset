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
import {
  Play,
  House,
  UserPlus,
  Loader2Icon,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  use,
  useState,
  useActionState,
  startTransition,
  Dispatch,
  SetStateAction,
} from "react";
import { getYjsProviderForRoom, LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";
import { PdfViewer } from "@/components/project/pdf-viewer";
import { Chat } from "@/components/project/chat";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Avatars } from "@/components/project/avatars";
import { renameProject } from "@/app/actions";
import { UserButtonSkeleton } from "@/components/project/skeletons";
import { InviteDialog } from "@/components/project/invite-dialog";
import { UserAccessInfo } from "@/types/user-access";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Editor } from "@/components/project/editor";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Room } from "@liveblocks/client";

export function CollaborativeEditor({
  title,
  userAccessInfo,
}: {
  title: Promise<string>;
  userAccessInfo: Promise<UserAccessInfo[]>;
}) {
  const room = useRoom();
  const router = useRouter();
  const yProvider = getYjsProviderForRoom(room);
  const isMobile = useIsMobile();

  const [tabValue, setTabValue] = useState<string>("chat");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<string | null>(null);

  /**
   * Compiles the current LaTeX content to PDF and updates the PDF viewer
   * @returns {Promise<void>} A promise that resolves when compilation is complete
   */
  const compile = async (): Promise<void> => {
    const content = yProvider.getYDoc().getText("codemirror").toString();

    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
      }),
    });

    if (!res.ok) {
      try {
        const errorData = await res.json();
        setCompileError(errorData.message || "Unknown error");
      } catch {
        setCompileError("Unknown error");
      }
      return;
    }

    const pdfBlob = await res.blob();
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    const newPdfUrl = URL.createObjectURL(pdfBlob);
    setCompileError(null);
    setPdfUrl(newPdfUrl);
    setTabValue("preview");
  };
  const [, compileAction, compilePending] = useActionState(compile, undefined);

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-editor text-sm">
        <NavigationMenu className="flex-0 max-w-none p-2">
          <div className="grid grid-cols-[1fr_auto_1fr] w-full">
            <div className="flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Button
                    onClick={() => router.push("/my-projects")}
                    variant="ghost"
                    size="icon"
                  >
                    <House />
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </div>
            <div className="justify-self-center">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Button
                    size="icon"
                    onClick={() => startTransition(compileAction)}
                    disabled={compilePending}
                  >
                    {compilePending ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <Play />
                    )}
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </div>
            <div className="flex justify-end" />
          </div>
        </NavigationMenu>

        <Tabs
          value={tabValue}
          onValueChange={setTabValue}
          className="flex-1 gap-0 overflow-hidden"
        >
          <TabsContent value="chat" className="px-2 overflow-hidden">
            <ChatPanel yProvider={yProvider} setNewFile={setNewFile} />
          </TabsContent>

          <TabsContent value="editor" className="px-2 overflow-hidden">
            <EditorPanel
              room={room}
              yProvider={yProvider}
              newFile={newFile}
              setNewFile={setNewFile}
              compileAction={compileAction}
            />
          </TabsContent>

          <TabsContent value="preview" className="px-2 overflow-hidden">
            <PreviewPanel compileError={compileError} pdfUrl={pdfUrl} />
          </TabsContent>

          <div className="flex-0 flex justify-center p-2">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-editor text-sm">
      <NavigationMenu className="max-w-none p-2">
        <div className="grid grid-cols-[1fr_auto_1fr] w-full">
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
                <TitlePopover title={title} room={room} />
              </NavigationMenuItem>
            </NavigationMenuList>
          </div>
          <div className="justify-self-center">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Button
                  onClick={() => startTransition(compileAction)}
                  disabled={compilePending}
                >
                  {compilePending ? (
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
                <InviteDialog
                  projectId={room.id}
                  userAccessInfo={userAccessInfo}
                >
                  <Button variant="secondary">
                    <UserPlus /> Invite
                  </Button>
                </InviteDialog>
              </NavigationMenuItem>
              <NavigationMenuItem className="flex flex-1 items-center">
                <UserButton
                  appearance={{
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
          <ChatPanel yProvider={yProvider} setNewFile={setNewFile} />
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <EditorPanel
            room={room}
            yProvider={yProvider}
            newFile={newFile}
            setNewFile={setNewFile}
            compileAction={compileAction}
          />
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <PreviewPanel compileError={compileError} pdfUrl={pdfUrl} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export function TitlePopover({
  room,
  title,
}: {
  room: Room;
  title: Promise<string>;
}) {
  const projectTitle = use(title);
  const [titleInput, setTitleInput] = useState(projectTitle);
  const isMobile = useIsMobile();

  return (
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
      <PopoverContent align={isMobile ? "center" : "start"}>
        <Input
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ChatPanel({
  yProvider,
  setNewFile,
}: {
  yProvider: LiveblocksYjsProvider;
  setNewFile: Dispatch<SetStateAction<string | null>>;
}) {
  return (
    <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border">
      <Chat yProvider={yProvider} setNewFile={setNewFile} />
    </div>
  );
}

export function EditorPanel({
  room,
  yProvider,
  newFile,
  setNewFile,
  compileAction,
}: {
  room: Room;
  yProvider: LiveblocksYjsProvider;
  newFile: string | null;
  setNewFile: Dispatch<SetStateAction<string | null>>;
  compileAction: () => void;
}) {
  const acceptEdit = () => {
    if (newFile === null) {
      return;
    }

    const yText = yProvider.getYDoc().getText("codemirror");
    yText.delete(0, yText.length);
    yText.insert(0, newFile);

    setNewFile(null);
    startTransition(compileAction);
  };

  const rejectEdit = () => {
    setNewFile(null);
  };

  return (
    <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border relative">
      <Editor room={room} yProvider={yProvider} newFile={newFile} />

      {/* Accept and reject buttons */}
      {newFile !== null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-editor border rounded-md p-2 flex gap-2">
          <Button variant="ghost" onClick={rejectEdit}>
            Reject
          </Button>
          <Button onClick={acceptEdit}>Accept</Button>
        </div>
      )}
    </div>
  );
}

export function PreviewPanel({
  compileError,
  pdfUrl,
}: {
  compileError: string | null;
  pdfUrl: string | null;
}) {
  return (
    <div className="flex flex-col h-full rounded-md overflow-hidden bg-editor-panel border">
      {compileError ? (
        <div className="flex flex-col p-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Compilation failed</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">
              {compileError}
            </AlertDescription>
          </Alert>
        </div>
      ) : pdfUrl ? (
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
  );
}

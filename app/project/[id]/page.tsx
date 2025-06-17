"use client";

import { LaTeXEditor } from "@/components/latex-editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { defaultTemplate } from "@/lib/templates";

export default function Home() {
  return (
    <div className="h-full p-2">
      <ResizablePanelGroup direction="horizontal" autoSaveId="editor">
        <ResizablePanel defaultSize={20}>
          <Card className="h-full">Chat</Card>
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <Card className="h-full">
            <LaTeXEditor />
          </Card>
        </ResizablePanel>

        <ResizableHandle className="mx-1 opacity-0 data-[resize-handle-state=drag]:opacity-100 transition-opacity duration-200" />

        <ResizablePanel defaultSize={40}>
          <Card className="h-full">Preview</Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

"use client";

import Editor from "@monaco-editor/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel className="p-2">
        {" "}
        <Editor
          defaultLanguage="LaTeX"
          defaultValue={`\\documentclass{article}
\\title{Blank Project}
\\author{Eddie Zhuang}
\\date{June 2025}

\\begin{document}

\\maketitle

\\section{Introduction}

\\end{document}`}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="p-2">Two</ResizablePanel>
    </ResizablePanelGroup>
  );
}

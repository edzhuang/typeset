"use client";

import { yCollab } from "y-codemirror.next";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { defaultKeymap, insertTab } from "@codemirror/commands";
import { keymap, EditorView } from "@codemirror/view";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { UserInfo } from "@/liveblocks.config";
import { useState, useEffect, useCallback } from "react";
import { useSelf } from "@liveblocks/react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import type { Room } from "@liveblocks/client";
import { useTheme } from "next-themes";
import { customTheme } from "@/lib/utils";
import { MergeView } from "@codemirror/merge";

export function Editor({
  room,
  yProvider,
  newFile,
}: {
  room: Room;
  yProvider: LiveblocksYjsProvider;
  newFile: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const [editor, setEditor] = useState<HTMLElement | undefined>();

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

    const stateConfig = {
      doc: yText.toString(),
      extensions: [
        basicSetup,
        customTheme,
        resolvedTheme === "dark" ? githubDark : githubLight,
        EditorView.lineWrapping,
        latex(),
        yCollab(yText, yProvider.awareness),
        keymap.of([...defaultKeymap, { key: "Tab", run: insertTab }]),
      ],
    };

    // Attach CodeMirror to element
    let view: EditorView | MergeView;
    if (newFile === null) {
      view = new EditorView({
        state: EditorState.create(stateConfig),
        parent: editor,
      });
    } else {
      view = new MergeView({
        a: stateConfig,
        b: {
          doc: newFile,
          extensions: [
            basicSetup,
            customTheme,
            resolvedTheme === "dark" ? githubDark : githubLight,
            EditorView.lineWrapping,
            latex(),
            EditorView.editable.of(false),
            EditorState.readOnly.of(true),
          ],
        },
        parent: editor,
      });
    }

    return () => {
      view?.destroy();
    };
  }, [editor, resolvedTheme, userInfo, room, yProvider, newFile]);

  return <div className="h-full" ref={editorRef} />;
}

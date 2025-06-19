"use client";

import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { useCallback, useEffect, useState } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";

export default function Editor({
  setEditorContent,
}: {
  setEditorContent: (content: string) => void;
}) {
  const room = useRoom();
  const yProvider = getYjsProviderForRoom(room);
  const [element, setElement] = useState<HTMLElement>();

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

    const observer = () => {
      setEditorContent(yText.toString());
    };
    yText.observe(observer);
    observer();

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
      yText.unobserve(observer);
      view?.destroy();
    };
  }, [element, room, setEditorContent, yProvider]);

  return <div ref={ref} />;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EditorView } from "@codemirror/view";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const customTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    height: "100%",
  },
  ".cm-mergeView": {
    height: "100%",
    overflow: "auto",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-content": {
    paddingTop: "1rem",
    paddingBottom: "1rem",
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
  },
  ".cm-gutter": {
    fontSize: "13px",
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
});

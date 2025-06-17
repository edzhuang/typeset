import { Editor } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { defaultTemplate } from "@/lib/templates";

export function LaTeXEditor() {
  const isLanguageRegistered = useRef(false);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    // Only register the language once
    if (!isLanguageRegistered.current) {
      // Register LaTeX language
      monaco.languages.register({ id: "latex" });

      // Define LaTeX syntax highlighting rules
      monaco.languages.setMonarchTokensProvider("latex", {
        tokenizer: {
          root: [
            // LaTeX commands
            [/\\[a-zA-Z@]+/, "keyword"],
            [/\\[{}]/, "keyword"],

            // Math environments
            [/\$\$/, "string", "@equation"],
            [/\$/, "string", "@inlineequation"],

            // Comments
            [/%.*$/, "comment"],

            // Braces and brackets
            [/\{/, "delimiter.curly"],
            [/\}/, "delimiter.curly"],
            [/\[/, "delimiter.square"],
            [/\]/, "delimiter.square"],

            // Special characters
            [/[&_^~]/, "keyword.operator"],
          ],
          equation: [
            [/\$\$/, "string", "@pop"],
            [/[^$]+/, "variable"],
          ],
          inlineequation: [
            [/\$/, "string", "@pop"],
            [/[^$]+/, "variable"],
          ],
        },
      });

      // Set language configuration for LaTeX
      monaco.languages.setLanguageConfiguration("latex", {
        comments: {
          lineComment: "%",
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: "$", close: "$" },
        ],
        surroundingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: "$", close: "$" },
        ],
      });

      isLanguageRegistered.current = true;
    }
  };

  return (
    <Editor
      language="latex"
      theme="vs-dark"
      defaultValue={defaultTemplate}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      }}
    />
  );
}

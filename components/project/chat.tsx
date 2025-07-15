"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import {
  SendHorizontal,
  ArrowDown,
  BotMessageSquare,
  LoaderCircle,
  Square,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemoizedMarkdown } from "@/components/project/memoized-markdown";
import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { UIMessage } from "ai";
import { CircleCheck } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";

const promptSuggestions = [
  "Add Transformer attention formula",
  "How do I write an integral?",
  "Check for spelling errors",
];

export function Chat({ yProvider }: { yProvider: LiveblocksYjsProvider }) {
  const {
    messages,
    status,
    input,
    stop,
    setInput,
    handleInputChange,
    handleSubmit,
  } = useChat({
    maxSteps: 5,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "editFile") {
        const yDoc = yProvider.getYDoc();
        const yMap = yDoc.getMap("files");
        const yText = yDoc.getText("codemirror");

        const oldFile = yText.toString();
        const { newFile } = toolCall.args as { newFile: string };

        yMap.set("oldFile", oldFile);
        yText.delete(0, yText.length);
        yText.insert(0, newFile);

        return "File edited";
      }
    },
  });
  const [model, setModel] = useState("gemini-2.5-flash");
  const scrollAreaViewportRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper: scroll to bottom
  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: behavior });
  }, []);

  // On new messages, scroll if autoScroll is enabled
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll, scrollToBottom]);

  // Track scroll position to toggle autoScroll and button
  useEffect(() => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      // If content fits in viewport, always autoscroll
      if (viewport.scrollHeight <= viewport.clientHeight) {
        setAutoScroll(true);
        return;
      }

      const atBottom =
        Math.abs(
          viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
        ) < 8;
      setAutoScroll(atBottom);
    };
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        const formEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(formEvent);
      }
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (status !== "ready") {
      return;
    }

    const fileContent = yProvider.getYDoc().getText("codemirror").toString();
    const base64Content = btoa(
      new TextEncoder()
        .encode(fileContent)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const dataUrl = `data:text/plain;charset=utf-8;base64,${base64Content}`;

    handleSubmit(event, {
      body: {
        model,
      },
      experimental_attachments: [
        {
          name: "main.tex",
          contentType: "text/plain;charset=utf-8",
          url: dataUrl,
        },
      ],
    });
    setAutoScroll(true);
  };

  const renderUserMessage = (message: UIMessage) => {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="whitespace-pre-wrap flex rounded-lg px-3 py-2 bg-muted">
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      </div>
    );
  };

  const renderAssistantMessage = (message: UIMessage) => {
    return (
      <div className="prose prose-sm dark:prose-invert px-4 py-2 space-y-2 max-w-none prose-figure:rounded-md prose-figure:border prose-pre:bg-transparent prose-pre:p-4 prose-pre:overflow-x-auto prose-code:text-[13px] prose-code:p-0">
        {message.parts.map((part, i) => {
          const partId = `${message.id}-${i}`;

          switch (part.type) {
            case "text":
              return (
                <MemoizedMarkdown
                  key={partId}
                  id={partId}
                  content={part.text}
                />
              );

            case "tool-invocation":
              const callId = part.toolInvocation.toolCallId;

              switch (part.toolInvocation.toolName) {
                case "editFile": {
                  switch (part.toolInvocation.state) {
                    case "partial-call":
                    case "call":
                      return (
                        <Alert key={callId}>
                          <LoaderCircle className="animate-spin" />
                          <AlertTitle>Editing file...</AlertTitle>
                        </Alert>
                      );
                    case "result":
                      return (
                        <Alert key={callId}>
                          <CircleCheck />
                          <AlertTitle>{part.toolInvocation.result}</AlertTitle>
                        </Alert>
                      );
                  }
                }
              }
          }
        })}
      </div>
    );
  };

  return (
    <div className="@container flex flex-col h-full min-h-0">
      {/* Messages */}
      <div
        className={clsx(
          "flex-1 overflow-hidden relative",
          messages.length === 0 && "hidden"
        )}
      >
        <div ref={scrollAreaViewportRef} className="size-full overflow-auto">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user"
                ? renderUserMessage(message)
                : renderAssistantMessage(message)}
            </div>
          ))}

          {/* Show spinner if waiting for assistant response */}
          {status !== "ready" &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <div className="px-4 py-2">
                <LoaderCircle className="animate-spin" />
              </div>
            )}
        </div>

        <div
          className={clsx(
            "absolute flex justify-center inset-x-0 bottom-2 z-10 transition-opacity duration-200",
            autoScroll
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          )}
        >
          <Button
            size="icon"
            variant="outline"
            className="rounded-full bg-editor-panel dark:bg-editor-panel hover:bg-accent dark:hover:bg-accent/50"
            onClick={() => {
              scrollToBottom("smooth");
            }}
          >
            <ArrowDown />
          </Button>
        </div>
      </div>

      {/* Welcome screen */}
      {messages.length == 0 && (
        <div className="flex flex-col gap-4 grow justify-center">
          <div className="flex flex-col justify-center items-center text-center px-4 gap-4">
            <BotMessageSquare className="size-10" />
            <h1 className="text-lg">Chat</h1>
          </div>

          <div className="flex @xs:justify-center relative">
            <div
              className="flex flex-wrap gap-2 justify-start @xs:justify-center px-4 max-w-md
                absolute left-0 w-screen @xs:static"
            >
              {promptSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  size="sm"
                  variant="secondary"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <form
        className="mx-2 mb-2 overflow-hidden cursor-text border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        onSubmit={onSubmit}
        onClick={() => {
          textareaRef.current?.focus();
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="placeholder:text-muted-foreground flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
                      resize-none min-h-9 max-h-42 border-none focus-visible:ring-0 dark:bg-transparent"
        />

        <div className="flex justify-between p-2 pointer-events-none gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="pointer-events-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gpt-4.1-mini">GPT-4.1 mini</SelectItem>
            </SelectContent>
          </Select>
          {status == "ready" ? (
            <Button type="submit" size="icon" className="pointer-events-auto">
              <SendHorizontal />
            </Button>
          ) : (
            <Button onClick={stop} size="icon" className="pointer-events-auto">
              <Square />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

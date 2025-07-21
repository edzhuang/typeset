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
import {
  useState,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import clsx from "clsx";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { UIMessage } from "ai";
import { CircleCheck } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";

const promptSuggestions = [
  "Add Transformer attention formula",
  "Improve formatting",
  "Inspect for errors",
  "How do I write an integral?",
];

export function Chat({
  yProvider,
  setNewFile,
}: {
  yProvider: LiveblocksYjsProvider;
  setNewFile: Dispatch<SetStateAction<string | null>>;
}) {
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
        const args = toolCall.args as { newFile: string };
        setNewFile(args.newFile);
        return "File edited";
      }
    },
  });
  const [model, setModel] = useState("gemini-2.5-flash");
  const scrollareaRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback(() => {
    const scrollArea = scrollareaRef.current;
    if (scrollArea) {
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight - scrollArea.clientHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const checkAtBottom = useCallback(() => {
    const scrollArea = scrollareaRef.current;
    if (!scrollArea) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    setAtBottom(scrollHeight - scrollTop - clientHeight < 5);
  }, []);

  useEffect(() => {
    if (status === "submitted") {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  useEffect(() => {
    const scrollArea = scrollareaRef.current;
    if (!scrollArea) return;

    scrollArea.addEventListener("scroll", checkAtBottom);
    checkAtBottom();

    return () => {
      scrollArea.removeEventListener("scroll", checkAtBottom);
    };
  }, [checkAtBottom]);

  useEffect(() => {
    const scrollArea = scrollareaRef.current;
    if (!scrollArea) return;

    const resizeObserver = new ResizeObserver(() => {
      checkAtBottom();
    });

    resizeObserver.observe(scrollArea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [checkAtBottom]);

  useEffect(() => {
    checkAtBottom();
  }, [messages, checkAtBottom]);

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
  };

  const renderUserMessage = (message: UIMessage) => {
    return (
      <div className="flex justify-end p-4">
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
      <div
        className="prose prose-sm dark:prose-invert p-4 space-y-2 max-w-none prose-figure:rounded-md prose-figure:border prose-pre:bg-transparent
                      prose-pre:p-4 prose-pre:overflow-x-auto prose-code:text-[13px] prose-code:p-0"
      >
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
    <div className="@container flex flex-col h-full">
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={scrollareaRef}
          className="flex flex-col size-full overflow-auto"
        >
          {messages.length == 0 ? (
            // Welcome screen
            <div className="flex flex-col gap-4 grow justify-center py-4">
              <div className="flex flex-col justify-center items-center text-center px-4 gap-4">
                <BotMessageSquare className="size-10" />
                <h1 className="text-lg">Chat</h1>
              </div>

              <div
                className="flex justify-start @sm:justify-center overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                <div className="flex gap-2 justify-start @sm:justify-center px-4 min-w-md @sm:min-w-0 max-w-md flex-wrap">
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
          ) : (
            // Messages
            <>
              {messages.map((message, index) => {
                const extend =
                  index === messages.length - 1 && message.role === "assistant";
                const messageElement =
                  message.role === "user"
                    ? renderUserMessage(message)
                    : renderAssistantMessage(message);

                return (
                  <div
                    key={message.id}
                    className={clsx(extend && "min-h-[calc(-500px+100dvh)]")}
                  >
                    {messageElement}
                  </div>
                );
              })}

              {/* Show spinner if waiting for assistant response */}
              {status !== "ready" &&
                messages.length > 0 &&
                messages[messages.length - 1].role === "user" && (
                  <div className="p-4 min-h-[calc(-500px+100dvh)]">
                    <LoaderCircle className="animate-spin" />
                  </div>
                )}
            </>
          )}
        </div>

        <div
          className={clsx(
            "absolute flex justify-center inset-x-0 bottom-2 z-10 transition-opacity duration-200",
            atBottom
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          )}
        >
          <Button
            size="icon"
            variant="outline"
            className="rounded-full bg-editor-panel dark:bg-editor-panel hover:bg-editor-panel dark:hover:bg-editor-panel"
            onClick={() => {
              scrollToBottom();
            }}
          >
            <ArrowDown />
          </Button>
        </div>
      </div>

      {/* Input */}
      <form
        className="mx-2 mb-2 overflow-hidden cursor-text border-input has-[textarea:focus]:border-ring has-[textarea:focus]:ring-ring/50 has-[textarea:focus]:ring-[3px]
                   dark:bg-input/30 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none z-10"
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
                      resize-none max-h-42 border-none"
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
          {(status === "ready" || status === "error") && (
            <Button
              type="submit"
              size="icon"
              className="pointer-events-auto disabled:pointer-events-auto disabled:hover:bg-primary"
              disabled={!input}
            >
              <SendHorizontal />
            </Button>
          )}

          {(status === "submitted" || status === "streaming") && (
            <Button
              onClick={() => stop()}
              size="icon"
              className="pointer-events-auto"
            >
              <Square />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

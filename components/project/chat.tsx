"use client";

import { useChat } from "@ai-sdk/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, History, SendHorizontal, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoizedMarkdown } from "@/components/project/memoized-markdown";
import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { UIMessage } from "ai";
import { CircleCheck } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";

export function Chat({ yProvider }: { yProvider: LiveblocksYjsProvider }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
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
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Helper: scroll to bottom
  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: behavior });
    }
  }, []);

  // On new messages, scroll if autoScroll is enabled
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll, scrollToBottom]);

  // Track scroll position to toggle autoScroll and button
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement;
    if (!viewport) return;

    const handleScroll = () => {
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
      <div className="prose dark:prose-invert p-4 space-y-2 max-w-none">
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
                    case "call":
                      return <div key={callId}>Editing file...</div>;
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
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex justify-between p-2 border-b">
        <div></div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Plus />
          </Button>
          <Button variant="ghost" size="icon">
            <History />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user"
                ? renderUserMessage(message)
                : renderAssistantMessage(message)}
            </div>
          ))}
        </ScrollArea>
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
            className="rounded-full dark:bg-card dark:hover:bg-card"
            onClick={() => {
              scrollToBottom("smooth");
            }}
          >
            <ArrowDown />
          </Button>
        </div>
      </div>

      {/* Input */}
      <form className="px-2 pb-2" onSubmit={onSubmit}>
        <div className="relative">
          <Textarea
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pb-15 resize-none"
          />
          <div className="absolute inline-flex justify-between bottom-0 inset-x-0 p-2 pointer-events-none overflow-hidden gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="pointer-events-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash">
                  Gemini 2.5 Flash
                </SelectItem>
                <SelectItem value="gpt-4.1-mini">GPT-4.1 mini</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="icon" className="pointer-events-auto">
              <SendHorizontal />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

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
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [model, setModel] = useState("gemini-2.5-flash");

  // --- Scroll management ---
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Helper: scroll to bottom
  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    const viewport = viewportRef.current;
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
    const viewport = viewportRef.current;
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

  // Custom submit handler to include model
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(event, {
      body: { model },
    });
    setAutoScroll(true);
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
        <ScrollArea className="h-full" ref={viewportRef}>
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end p-4">
                  <div className="whitespace-pre-wrap flex rounded-lg px-3 py-2 bg-muted">
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div key={`${message.id}-${i}`}>{part.text}</div>
                          );
                      }
                    })}
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert p-4 space-y-2 max-w-none">
                  <MemoizedMarkdown id={message.id} content={message.content} />
                </div>
              )}
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
      <form className="relative px-2 pb-2" onSubmit={onSubmit}>
        <Textarea
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="pb-15 resize-none"
        />
        <div className="absolute inline-flex justify-between bottom-2 inset-x-2 p-2 pointer-events-none">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="pointer-events-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gpt-4.1-mini">GPT-4.1 mini</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" className="pointer-events-auto">
            <SendHorizontal />
          </Button>
        </div>
      </form>
    </div>
  );
}

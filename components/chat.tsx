"use client";

import { useChat } from "@ai-sdk/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end p-4">
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
              <div key={message.id} className="whitespace-pre-wrap p-4">
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <div key={`${message.id}-${i}`}>{part.text}</div>;
                  }
                })}
              </div>
            )
          )}
        </ScrollArea>
      </div>

      <form className="relative px-2 pb-2" onSubmit={handleSubmit}>
        <Textarea
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="pb-15 resize-none"
        />
        <div className="absolute inline-flex justify-between bottom-2 inset-x-2 p-2 pointer-events-none">
          <Select>
            <SelectTrigger className="pointer-events-auto">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
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

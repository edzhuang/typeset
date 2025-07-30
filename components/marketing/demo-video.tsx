"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export function DemoVideo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="ghost">
        Watch Demo
      </Button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed dark text-foreground bg-background inset-0 flex flex-col justify-center items-center md:p-5"
        >
          <Button
            className="absolute right-5 top-5"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X className="size-6" />
          </Button>

          <iframe
            key={open ? "open" : "closed"}
            className="max-w-[1280px] max-h-[720px] w-full h-auto md:size-full aspect-video z-10"
            src="https://www.youtube.com/embed/thOFQq8fat0?si=Pjlc5qGxUSgl7vs2&autoplay=1"
            allowFullScreen
            allow="autoplay"
          />
        </div>
      )}
    </>
  );
}

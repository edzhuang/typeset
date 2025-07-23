"use client";

import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a fallback during SSR or before mounting
  const previewSrc =
    resolvedTheme === "dark" ? "/preview-dark.png" : "/preview-light.png";

  return (
    <div className="grow flex flex-col">
      <div className="flex justify-center">
        <div className="container flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4 px-4 md:px-8 lg:px-16">
          <h1 className="text-foreground leading-tighter max-w-2xl text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] lg:font-semibold xl:text-5xl xl:tracking-tighter">
            Cursor for LaTeX
          </h1>
          <p className="text-foreground max-w-3xl text-base text-balance sm:text-lg">
            The first AI-powered, collaborative, online LaTeX editor
          </p>
          <div className="flex w-full items-center justify-center gap-2 pt-2 **:data-[slot=button]:shadow-none">
            <SignUpButton>
              <Button>Get Started</Button>
            </SignUpButton>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start sm:items-center px-5 md:px-10 pb-14 md:pb-24 overflow-hidden">
        {mounted && (
          <div className="w-[160vw] sm:w-full sm:max-w-[1248px] overflow-hidden rounded-md border">
            <Image
              src={previewSrc}
              width={2880}
              height={1800}
              alt="Preview of the app"
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PreviewImage } from "@/components/marketing/preview-image";
import { DemoVideo } from "@/components/marketing/demo-video";
import { useState } from "react";
import { ArrowRight, Sparkles, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    label: "AI-powered",
    description: "Intelligent suggestions and autocomplete",
  },
  {
    icon: Users,
    label: "Collaborative",
    description: "Real-time multiplayer editing",
  },
  {
    icon: Zap,
    label: "Instant compile",
    description: "See your PDF update as you type",
  },
];

export function LandingHero() {
  const [previewLoaded, setPreviewLoaded] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex justify-center px-4 md:px-8 lg:px-16">
        <div className="flex flex-col items-center gap-6 py-16 text-center md:py-24 lg:py-28 max-w-4xl w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Now in public beta
          </div>

          {/* Headline */}
          <h1 className="text-foreground max-w-2xl text-5xl font-semibold tracking-tight text-balance leading-[1.1] xl:text-6xl xl:tracking-tighter">
            Write LaTeX the{" "}
            <span className="text-primary">smart way</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-muted-foreground max-w-xl text-base text-balance leading-relaxed sm:text-lg">
            Typeset is the first AI-powered, collaborative LaTeX editor — built for researchers, students, and academics who demand more.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 **:data-[slot=button]:shadow-none">
            <SignUpButton>
              <Button size="lg" className="gap-1.5">
                Start writing free
                <ArrowRight className="size-4" />
              </Button>
            </SignUpButton>
            <DemoVideo />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {features.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                <Icon className="size-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-muted-foreground hidden sm:inline">
                  — {description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App preview */}
      <section className="flex flex-col items-start sm:items-center px-4 md:px-8 pb-16 overflow-hidden">
        {/* Fade-in wrapper */}
        <div
          className="transition-opacity duration-500"
          style={{ opacity: previewLoaded ? 1 : 0 }}
        >
          <div className="relative">
            {/* Decorative glow behind screenshot */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -top-6 h-24 bg-primary/10 blur-3xl rounded-full"
            />
            <PreviewImage onLoad={() => setPreviewLoaded(true)} />
          </div>
        </div>
      </section>
    </div>
  );
}

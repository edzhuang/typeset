import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PreviewImage } from "@/components/marketing/preview-image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

export default async function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-center">
        <div className="container flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4 px-4 md:px-8 lg:px-16">
          <Badge variant="secondary" className="rounded-full" asChild>
            <Link href="https://x.com/edzhuan/status/1950251946444455958">
              Launch Video
              <ArrowRightIcon />
            </Link>
          </Badge>
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

      <div className="flex flex-col items-start sm:items-center px-6 md:px-10 pb-6 overflow-hidden">
        <PreviewImage />
      </div>
    </div>
  );
}

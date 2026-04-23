"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  const router = useRouter();

  return (
    <NavigationMenu className="flex justify-center flex-0 sticky top-0 max-w-full bg-background/80 backdrop-blur-md border-b border-border/60 z-50">
      <div className="flex h-14 items-center justify-between gap-2 w-full box-content max-w-[1248px] px-6">
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/home" className="flex flex-row gap-2 items-center group">
              <Image src="/typeset.svg" width={22} height={22} alt="Logo" />
              <span className="text-sm font-semibold tracking-tight">Typeset</span>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>

        <NavigationMenuList className="gap-1.5">
          {/* Show skeleton while Clerk is loading */}
          <ClerkLoading>
            <NavigationMenuItem className="hidden lg:flex gap-1.5">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </NavigationMenuItem>
          </ClerkLoading>

          <ClerkLoaded>
            <SignedOut>
              <NavigationMenuItem className="hidden lg:block">
                <SignInButton>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Log in
                  </Button>
                </SignInButton>
              </NavigationMenuItem>
              <NavigationMenuItem className="hidden lg:block">
                <SignUpButton>
                  <Button size="sm">Get started</Button>
                </SignUpButton>
              </NavigationMenuItem>
            </SignedOut>

            <SignedIn>
              <NavigationMenuItem className="hidden lg:block">
                <Button size="sm" onClick={() => router.push("/my-projects")}>
                  Open app
                </Button>
              </NavigationMenuItem>
            </SignedIn>
          </ClerkLoaded>

          <NavigationMenuItem className="lg:hidden">
            <MobileNav />
          </NavigationMenuItem>
        </NavigationMenuList>
      </div>
    </NavigationMenu>
  );
}

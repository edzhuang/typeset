"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();

  return (
    <NavigationMenu className="flex justify-center flex-0 sticky top-0 max-w-full bg-background">
      <div className="flex h-14 items-center justify-between gap-2 w-full box-content max-w-[1248px] px-6">
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" className="flex flex-row gap-2 items-center">
              <Image src="/typeset.svg" width={24} height={24} alt="Logo" />
              <span className="text-base font-semibold">Typeset</span>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>

        <NavigationMenuList className="gap-2">
          <SignedOut>
            <NavigationMenuItem className="hidden lg:block">
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </SignInButton>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden lg:block">
              <SignUpButton>
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </NavigationMenuItem>
          </SignedOut>

          <SignedIn>
            <NavigationMenuItem className="hidden lg:block">
              <Button onClick={() => router.push("/my-projects")}>
                Open App
              </Button>
            </NavigationMenuItem>
          </SignedIn>

          <NavigationMenuItem className="lg:hidden">
            <MobileNav />
          </NavigationMenuItem>
        </NavigationMenuList>
      </div>
    </NavigationMenu>
  );
}

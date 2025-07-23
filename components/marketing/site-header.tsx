import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/marketing/mobile-nav";

export function SiteHeader() {
  return (
    <NavigationMenu className="flex-0 sticky top-0 max-w-full bg-background">
      <div className="w-full 3xl:fixed:px-0 px-6">
        <div className="3xl:fixed:container flex h-14 items-center justify-between gap-2">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" className="flex flex-row gap-2">
                <Image src="/typeset.svg" width={24} height={24} alt="Logo" />
                <span className="text-base font-semibold">Typeset</span>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>

          <NavigationMenuList className="gap-2">
            <NavigationMenuItem className="hidden lg:block">
              <SignInButton>
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </SignInButton>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden lg:block">
              <SignUpButton>
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </NavigationMenuItem>
            <NavigationMenuItem className="lg:hidden">
              <MobileNav />
            </NavigationMenuItem>
          </NavigationMenuList>
        </div>
      </div>
    </NavigationMenu>
  );
}

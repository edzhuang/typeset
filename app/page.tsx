import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function Page() {
  const { userId } = await auth();
  if (userId) redirect("/my-projects");

  return (
    <div className="h-dvh w-full">
      <NavigationMenu className="sticky top-0 max-w-full bg-background">
        <div className="w-full 3xl:fixed:px-0 px-6">
          <div className="3xl:fixed:container flex h-14 items-center justify-between gap-2">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button asChild variant="ghost">
                  <Link href="/">
                    <Image
                      src="/typeset.svg"
                      width={24}
                      height={24}
                      alt="Logo"
                    />
                    <span className="text-base font-semibold">Typeset</span>
                  </Link>
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>

            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <SignInButton>
                  <Button variant="outline">Log In</Button>
                </SignInButton>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <SignUpButton>
                  <Button>Sign Up</Button>
                </SignUpButton>
              </NavigationMenuItem>
            </NavigationMenuList>
          </div>
        </div>
      </NavigationMenu>

      <div className="grow flex flex-col">
        <div className="flex justify-center">
          <div className="container flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4 px-4 md:px-8 lg:px-16">
            <h1 className="text-foreground leading-tighter max-w-2xl text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] lg:font-semibold xl:text-5xl xl:tracking-tighter">
              Cursor for LaTeX
            </h1>
            <p className="text-foreground max-w-3xl text-base text-balance sm:text-lg">
              The world&apos;s first AI-powered, collaborative, online LaTeX
              editor
            </p>
            <div className="flex w-full items-center justify-center gap-2 pt-2 **:data-[slot=button]:shadow-none">
              <SignUpButton>
                <Button>Get Started</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

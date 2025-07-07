import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const { userId } = await auth();
  if (userId) redirect("/my-projects");

  return (
    <div>
      <NavigationMenu className="fixed top-0 w-full">
        <NavigationMenuList>
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
      </NavigationMenu>
    </div>
  );
}

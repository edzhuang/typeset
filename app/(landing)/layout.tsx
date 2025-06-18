import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
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

      {children}
    </>
  );
}

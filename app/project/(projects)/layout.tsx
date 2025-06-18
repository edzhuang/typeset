import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { UserButton } from "@clerk/nextjs";

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
            <UserButton />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {children}
    </>
  );
}

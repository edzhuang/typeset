"use client";

import * as React from "react";
import {
  IconFolder,
  IconInnerShadowTop,
  IconUsers,
  IconHome,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";

const data = {
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: IconHome,
    },
    {
      title: "My Projects",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Shared With Me",
      url: "#",
      icon: IconUsers,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isLoaded, user } = useUser();

  if (isLoaded && user) {
    data.user = {
      name: user.username || "",
      email: user.emailAddresses[0].emailAddress,
      avatar: user.imageUrl,
    };
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Typeset</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {isLoaded ? <NavUser user={data.user} /> : <div>Loading...</div>}
      </SidebarFooter>
    </Sidebar>
  );
}

// src/components/main-nav.tsx
"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Keyboard, Zap, Book, UserCircle } from "lucide-react";
import { Logo } from "./logo";
import { useSidebar } from "@/hooks/use-sidebar.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/firebase";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user, isUserLoading: isLoading } = useUser();

  const menuItems = [
    { href: "/", label: "Головна", icon: Home },
    { href: "/hotkeys", label: "Гарячі клавіші", icon: Keyboard },
    { href: "/workflows", label: "Процеси", icon: Zap },
    { href: "/notes", label: "Нотатки", icon: Book },
  ];

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref onClick={handleLinkClick}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
         {isLoading ? (
            <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
            </div>
         ) : user ? (
          <div className="flex items-center gap-2 p-2 overflow-hidden">
             <Avatar className="h-8 w-8">
                <AvatarFallback><UserCircle /></AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">Анонімний користувач</span>
          </div>
        ) : null}
      </SidebarFooter>
    </TooltipProvider>
  );
}

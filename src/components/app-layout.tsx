// src/components/app-layout.tsx
"use client";

import { SidebarProvider } from "@/hooks/use-sidebar.tsx";
import { MainNav } from "./main-nav";
import { SiteHeader } from "./site-header";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [user, isUserLoading, auth]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Завантаження та вхід...</div>
      </div>
    );
  }

  return (
      <SidebarProvider>
        <div className="relative flex min-h-screen w-full">
          <DesktopSidebar>
            <MainNav />
          </DesktopSidebar>
          <MobileSidebar>
            <MainNav />
          </MobileSidebar>
          <div className="flex flex-col flex-1">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </SidebarProvider>
  );
}

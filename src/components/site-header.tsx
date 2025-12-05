// src/components/site-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { usePathname } from "next/navigation";
import { Home, Keyboard, Zap, Book, PanelLeft } from "lucide-react";
import { useSoftwareContext } from "@/context/software-context";
import { Badge } from "@/components/ui/badge";

const pageConfig: { [key: string]: { title: string; icon: React.ElementType } } = {
  "/": { title: "Головна", icon: Home },
  "/hotkeys": { title: "Довідник гарячих клавіш", icon: Keyboard },
  "/workflows": { title: "Поради по робочому процесу", icon: Zap },
  "/notes": { title: "Мої нотатки", icon: Book },
};

export function SiteHeader() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { selectedSoftware } = useSoftwareContext();
  const { title, icon: Icon } = pageConfig[pathname] ?? { title: "", icon: null };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <h1 className="text-lg font-medium">{title}</h1>
          </div>
          <Badge className="bg-accent text-accent-foreground">{selectedSoftware}</Badge>
        </div>
      </div>
    </header>
  );
}

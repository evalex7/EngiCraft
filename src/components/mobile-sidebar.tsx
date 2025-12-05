"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useSidebar } from "@/hooks/use-sidebar";

const MobileSidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { openMobile, setOpenMobile } = useSidebar()
    
    return (
        <div ref={ref} className={cn("md:hidden", className)} {...props}>
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent
                className="w-[18rem] bg-card p-0 text-card-foreground"
                side="left"
            >
                <SheetTitle className="sr-only">Меню</SheetTitle>
                <div className="flex h-full w-full flex-col">{children}</div>
            </SheetContent>
            </Sheet>
        </div>
    )
  }
)
MobileSidebar.displayName = "MobileSidebar"

export { MobileSidebar }

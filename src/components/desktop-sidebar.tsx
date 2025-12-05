"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar";

const DesktopSidebar = React.forwardRef<
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
    const { state } = useSidebar()
    
    return (
        <div
          ref={ref}
          className={cn(
              "hidden md:flex h-svh flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
              state === 'expanded' ? 'w-[16rem]' : 'w-[3.5rem]',
              className
          )}
          {...props}
        >
          {children}
        </div>
    )
  }
)
DesktopSidebar.displayName = "DesktopSidebar"

export { DesktopSidebar }

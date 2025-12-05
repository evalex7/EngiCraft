import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-primary"
      >
        <path d="M5 5v14h14" />
        <path d="M19 5v2" />
        <path d="M12 5v14" />
        <path d="M5 12h7" />
        <path d="M16 12h3" />
        <path d="M19 19V10c0-2-1-4-3-4" />
      </svg>
      <span className="text-lg font-semibold">EngiCraft</span>
    </div>
  );
}

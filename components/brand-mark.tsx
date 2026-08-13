import { Command } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-foreground text-background shadow-lg shadow-black/10 ring-1 ring-foreground/10",
        className,
      )}
    >
      <Command className="size-[45%]" strokeWidth={1.8} />
      <span className="absolute bottom-[15%] size-1 rounded-full bg-background/50" />
    </span>
  );
}

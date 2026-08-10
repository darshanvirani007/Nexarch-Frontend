import { BrandMark } from "./brand-mark";
import { cn } from "@/lib/utils";

export function NexarchLoader({
  label = "Preparing your workspace",
  description = "Securely loading your Nexarch data. This may take a moment.",
  fullScreen = false,
}: {
  label?: string;
  description?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn("nexarch-loader-stage grid place-items-center px-5", fullScreen && "min-h-screen")}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="nexarch-loader-shell panel w-full max-w-md rounded-[28px] px-7 py-10 text-center sm:px-10">
        <div className="nexarch-loader-emblem mx-auto">
          <span className="nexarch-loader-signal nexarch-loader-signal-one" />
          <span className="nexarch-loader-signal nexarch-loader-signal-two" />
          <span className="nexarch-loader-orbit nexarch-loader-orbit-outer" />
          <span className="nexarch-loader-orbit nexarch-loader-orbit-inner" />
          <span className="nexarch-loader-satellite nexarch-loader-satellite-one" />
          <span className="nexarch-loader-satellite nexarch-loader-satellite-two" />
          <BrandMark className="nexarch-loader-mark size-14 rounded-[18px]" />
        </div>
        <p className="muted mt-7 text-[10px] font-semibold uppercase tracking-[.24em]">Nexarch</p>
        <p className="mt-2 text-base font-semibold tracking-tight">{label}</p>
        <p className="muted mx-auto mt-2 max-w-xs text-sm leading-relaxed">{description}</p>
        <div className="nexarch-loader-dots mx-auto mt-6" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return <span className={cn("nexarch-inline-loader", className)} aria-hidden="true" />;
}

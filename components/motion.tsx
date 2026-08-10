"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function MotionList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [revealing, setRevealing] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setRevealing(false), 760);
    return () => window.clearTimeout(timeout);
  }, []);

  return <div className={cn(revealing && "motion-list", className)} {...props} />;
}

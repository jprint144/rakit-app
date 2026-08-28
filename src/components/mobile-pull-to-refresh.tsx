import { useRef, useState } from "react";
import type { ReactNode, TouchEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const refreshThreshold = 72;

export function MobilePullToRefresh({ children, onRefresh }: { children: ReactNode; onRefresh: () => Promise<void> | void }) {
  const startY = useRef<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0 && !refreshing) startY.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const nextDistance = event.touches[0].clientY - startY.current;
    if (nextDistance > 0) setDistance(Math.min(nextDistance * 0.45, refreshThreshold));
  };
  const onTouchEnd = async () => {
    const shouldRefresh = distance >= refreshThreshold;
    startY.current = null;
    setDistance(0);
    if (!shouldRefresh || refreshing) return;
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  };

  return <div className="relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => void onTouchEnd()}>
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center transition-opacity md:hidden", (distance > 0 || refreshing) ? "opacity-100" : "opacity-0")} style={{ transform: `translateY(${Math.max(distance - 10, 0)}px)` }}>
      <div className="rounded-full bg-background p-2 shadow-sm"><LoaderCircle className={cn("size-4 text-primary", (distance > 0 || refreshing) && "animate-spin")} /></div>
    </div>
    <div>{children}</div>
  </div>;
}

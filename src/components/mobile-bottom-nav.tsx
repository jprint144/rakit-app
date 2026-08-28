import { FileText, LayoutDashboard, Lightbulb, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

const items = [
  { label: "Beranda", url: "/", icon: LayoutDashboard },
  { label: "Tugas", url: "/tugas-harian", icon: FileText },
  { label: "Idea", url: "/idea", icon: Lightbulb },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { toggleSidebar } = useSidebar();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden" aria-label="Navigasi utama">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
          return (
            <Link key={item.url} to={item.url} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs text-muted-foreground", active && "bg-accent text-accent-foreground")}>
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={toggleSidebar} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs text-muted-foreground" aria-label="Buka menu lengkap">
          <Menu className="size-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}

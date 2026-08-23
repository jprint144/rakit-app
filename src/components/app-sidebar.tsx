import {
  Archive,
  FileText,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Wallet,
} from "lucide-react";
import { NavMain, type NavMainItem } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
const dashboardItems: NavMainItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];
const workItems: NavMainItem[] = [
  { title: "Project", url: "/project", icon: FolderKanban },
  { title: "Keuangan", url: "/finance", icon: Wallet },
  { title: "Invoice / Nota", url: "/invoice", icon: FileText },
];
const systemItems: NavMainItem[] = [
  { title: "Archive", url: "/archive", icon: Archive },
  { title: "Settings", url: "/settings", icon: Settings },
];
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const exploreItems: NavMainItem[] = [
    { title: "Idea", url: "/idea", icon: Lightbulb },
    { title: "Reference", url: "/reference", icon: Globe },
  ];
  return (
    <Sidebar collapsible="icon" className="overflow-x-hidden" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Rakit">
              <img
                src="/branding/rakit-logo.png"
                alt="Logo Rakit"
                className="size-8 shrink-0 object-contain"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Rakit</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Rapikan · Atur · Kembangkan
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 overflow-x-hidden">
        <NavMain items={dashboardItems} label="Utama" />
        <NavMain items={workItems} label="Kelola kerja" />
        <NavMain items={exploreItems} label="Eksplorasi" />
        <NavMain items={systemItems} label="Lainnya" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

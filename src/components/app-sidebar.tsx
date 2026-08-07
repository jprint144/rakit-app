import {
  Archive,
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
  {
    title: "Finance",
    url: "/finance",
    icon: Wallet,
    items: [
      { title: "Keuangan", url: "/finance/keuangan" },
      { title: "Invoice", url: "/invoice" },
    ],
  },
];
const exploreItems: NavMainItem[] = [
  { title: "Idea", url: "/idea", icon: Lightbulb },
  { title: "Reference", url: "/reference", icon: Globe },
];
const systemItems: NavMainItem[] = [
  { title: "Archive", url: "/archive", icon: Archive },
  { title: "Settings", url: "/settings", icon: Settings },
];
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="overflow-x-hidden" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Rakit">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                R
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Rakit</span>
                <span className="truncate text-xs text-muted-foreground">
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

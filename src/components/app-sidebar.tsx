import * as React from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";

type TreeLeaf = { label: string; url: string };
type TreeBranch = [label: string, items: TreeItem[]];
type TreeItem = TreeLeaf | TreeBranch;

const shortcuts: TreeLeaf[] = [
  { label: "Dashboard", url: "/" },
  { label: "Project", url: "/project" },
  { label: "Keuangan", url: "/finance" },
  { label: "Tugas Harian", url: "/tugas-harian" },
];

const navigation: TreeBranch[] = [
  ["Kelola kerja", [
    { label: "Project", url: "/project" },
    { label: "Keuangan", url: "/finance" },
    { label: "Invoice / Nota", url: "/invoice" },
  ]],
  ["Pribadi", [
    { label: "Tugas Harian", url: "/tugas-harian" },
  ]],
  ["Eksplorasi", [
    { label: "Idea", url: "/idea" },
    { label: "Reference", url: "/reference" },
  ]],
  ["Lainnya", [
    { label: "Archive", url: "/archive" },
    { label: "Settings", url: "/settings" },
  ]],
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pintasan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shortcuts.map((item) => (
                <Tree key={item.label} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <Tree key={item[0]} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function Tree({ item }: { item: TreeItem }) {
  const { pathname } = useLocation();

  if (!Array.isArray(item)) {
    const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link to={item.url}>
            <File />
            {item.label}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const [name, items] = item;
  const isActive = items.some((child) =>
    Array.isArray(child)
      ? child[1].some((nested) => !Array.isArray(nested) && pathname.startsWith(nested.url))
      : child.url === "/"
        ? pathname === "/"
        : pathname.startsWith(child.url),
  );

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={isActive}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive}>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem) => (
              <Tree
                key={Array.isArray(subItem) ? subItem[0] : subItem.label}
                item={subItem}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

import * as React from "react";
import { ChevronRight, Circle, CircleDot, File, Folder, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { defaultSidebarFolders, defaultSidebarShortcuts, loadSidebarFolders, loadSidebarShortcuts, saveSidebarFolders, saveSidebarShortcuts } from "@/features/settings/settings-repository";
import type { SidebarFolderConfig, SidebarShortcutConfig } from "@/features/settings/settings-repository";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarRail } from "@/components/ui/sidebar";

type TreeLeaf = { label: string; url: string; color?: string };
type AccountSummary = { name: string; email: string; avatarUrl?: string };

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [account, setAccount] = React.useState<AccountSummary | null>(null);
  const [folders, setFolders] = React.useState<SidebarFolderConfig[]>(defaultSidebarFolders);
  const [shortcuts, setShortcuts] = React.useState<SidebarShortcutConfig[]>(defaultSidebarShortcuts);
  const [folderDraft, setFolderDraft] = React.useState<SidebarFolderConfig | null>(null);
  const [shortcutDraft, setShortcutDraft] = React.useState<SidebarShortcutConfig[] | null>(null);

  React.useEffect(() => {
    const readAccount = async () => {
      const { data } = await supabase.auth.getUser(); const user = data.user;
      if (!user?.email) return setAccount(null);
      const metadata = user.user_metadata;
      setAccount({ name: metadata.full_name ?? metadata.name ?? user.email.split("@")[0], email: user.email, avatarUrl: metadata.avatar_url ?? metadata.picture });
    };
    void readAccount();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => { void readAccount(); });
    return () => subscription.subscription.unsubscribe();
  }, []);
  React.useEffect(() => { void loadSidebarFolders().then(setFolders).catch(console.error); void loadSidebarShortcuts().then(setShortcuts).catch(console.error); }, []);

  const initials = account?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "RK";
  const openFolderSettings = (folder: SidebarFolderConfig) => setFolderDraft({ ...folder, items: folder.items.map((item) => ({ ...item })) });
  const saveFolder = async () => {
    if (!folderDraft) return;
    const next = folders.map((folder) => folder.id === folderDraft.id ? folderDraft : folder);
    setFolders(next); setFolderDraft(null);
    try { await saveSidebarFolders(next); } catch (error) { console.error(error); void loadSidebarFolders().then(setFolders); }
  };
  const saveShortcuts = async () => {
    if (!shortcutDraft) return;
    setShortcuts(shortcutDraft); setShortcutDraft(null);
    try { await saveSidebarShortcuts(shortcutDraft); } catch (error) { console.error(error); void loadSidebarShortcuts().then(setShortcuts); }
  };

  return <>
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup><div className="flex items-center justify-between pr-2"><SidebarGroupLabel>Pintasan</SidebarGroupLabel><Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Atur pintasan" onClick={() => setShortcutDraft(shortcuts.map((item) => ({ ...item })))}><MoreHorizontal /></Button></div><SidebarGroupContent><SidebarMenu>{shortcuts.map((item) => <Leaf key={item.url} item={item} showArrow />)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
        <SidebarGroup><SidebarGroupLabel>Navigasi</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{folders.map((folder) => <FolderTree key={folder.id} folder={folder} onSettings={openFolderSettings} />)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2"><Link to="/settings" className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"><Avatar className="size-9 rounded-lg"><AvatarImage src={account?.avatarUrl} alt={account?.name ?? "Akun Rakit"} /><AvatarFallback className="rounded-lg bg-sidebar-accent text-xs font-semibold">{initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{account?.name ?? "Belum masuk"}</p><p className="truncate text-xs text-muted-foreground">{account?.email ?? "Masuk untuk sinkronisasi"}</p></div></Link></SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <Dialog open={Boolean(folderDraft)} onOpenChange={(open) => !open && setFolderDraft(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Atur folder sidebar</DialogTitle></DialogHeader>{folderDraft && <div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Nama folder<Input value={folderDraft.name} onChange={(event) => setFolderDraft({ ...folderDraft, name: event.target.value })} /></label><label className="grid gap-2 text-sm font-medium">Warna folder<div className="flex items-center gap-3"><input className="size-10 cursor-pointer rounded-md border bg-transparent p-1" type="color" value={folderDraft.color} onChange={(event) => setFolderDraft({ ...folderDraft, color: event.target.value })} /><span className="text-sm text-muted-foreground">Dipakai untuk garis dan fill ikon folder.</span></div></label><div className="grid gap-2"><p className="text-sm font-medium">Menu di dalam folder</p>{folderDraft.items.map((item, index) => <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" key={item.url}><label className="grid gap-1 text-xs text-muted-foreground">{item.url}<Input value={item.label} onChange={(event) => setFolderDraft({ ...folderDraft, items: folderDraft.items.map((current, itemIndex) => itemIndex === index ? { ...current, label: event.target.value } : current) })} /></label><input className="mt-5 size-10 cursor-pointer rounded-md border bg-transparent p-1" type="color" value={item.color} aria-label={`Warna ${item.label}`} onChange={(event) => setFolderDraft({ ...folderDraft, items: folderDraft.items.map((current, itemIndex) => itemIndex === index ? { ...current, color: event.target.value } : current) })} /></div>)}</div></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setFolderDraft(null)}>Batal</Button><Button type="button" onClick={() => void saveFolder()}>Simpan</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(shortcutDraft)} onOpenChange={(open) => !open && setShortcutDraft(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Atur pintasan</DialogTitle></DialogHeader>{shortcutDraft && <div className="grid gap-3">{shortcutDraft.map((item, index) => <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" key={item.url}><label className="grid gap-1 text-xs text-muted-foreground">{item.url}<Input value={item.label} onChange={(event) => setShortcutDraft(shortcutDraft.map((current, itemIndex) => itemIndex === index ? { ...current, label: event.target.value } : current))} /></label><input className="mt-5 size-10 cursor-pointer rounded-md border bg-transparent p-1" type="color" value={item.color} aria-label={`Warna ${item.label}`} onChange={(event) => setShortcutDraft(shortcutDraft.map((current, itemIndex) => itemIndex === index ? { ...current, color: event.target.value } : current))} /></div>)}</div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setShortcutDraft(null)}>Batal</Button><Button type="button" onClick={() => void saveShortcuts()}>Simpan</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

function Leaf({ item, showArrow = false }: { item: TreeLeaf; showArrow?: boolean }) {
  const { pathname } = useLocation(); const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
  return <SidebarMenuItem><SidebarMenuButton asChild isActive={active}><Link to={item.url}>{showArrow && (active ? <Circle className="size-2.5 fill-current" /> : <CircleDot className="size-2.5 text-muted-foreground" />)}<File style={item.color ? { color: item.color, fill: item.color } : undefined} />{item.label}</Link></SidebarMenuButton></SidebarMenuItem>;
}

function FolderTree({ folder, onSettings }: { folder: SidebarFolderConfig; onSettings: (folder: SidebarFolderConfig) => void }) {
  const { pathname } = useLocation(); const active = folder.items.some((item) => pathname.startsWith(item.url));
  return <SidebarMenuItem className="relative"><Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90" defaultOpen={active}><CollapsibleTrigger asChild><SidebarMenuButton isActive={active}><ChevronRight className="transition-transform" /><Folder style={{ color: folder.color, fill: folder.color }} />{folder.name}</SidebarMenuButton></CollapsibleTrigger><CollapsibleContent><SidebarMenuSub>{folder.items.map((item) => <Leaf key={item.url} item={item} />)}</SidebarMenuSub></CollapsibleContent></Collapsible><Button className="absolute right-1 top-4 z-10 size-7 -translate-y-1/2" type="button" size="icon" variant="ghost" aria-label={`Atur ${folder.name}`} onClick={() => onSettings(folder)}><MoreHorizontal /></Button></SidebarMenuItem>;
}

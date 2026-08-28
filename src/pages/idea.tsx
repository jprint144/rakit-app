import { useEffect, useState } from "react";
import {
  ExternalLink,
  Eye,
  FileText,
  Lightbulb,
  Link,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobilePullToRefresh } from "@/components/mobile-pull-to-refresh";
import { scheduleRakitSync, syncRakitEditableData } from "@/features/sync/supabase-sync";
import { IdeaForm } from "@/features/idea/idea-form";
import { openIdeaText } from "@/features/idea/idea-text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  deleteIdea,
  listIdeas,
  presetIdeaCategories,
  saveIdea,
} from "@/features/idea/idea-repository";
import type { Idea, IdeaInput } from "@/features/idea/idea-repository";

const openItem = (path: string, link = false) =>
  (link ? openUrl(path) : openPath(path)).catch(console.error);

export default function IdeaPage() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [viewing, setViewing] = useState<Idea | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Idea | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const load = () => listIdeas().then(setIdeas).catch(console.error);
  useEffect(() => {
    load();
  }, []);
  const save = async (input: IdeaInput) => {
    await saveIdea(input, editing?.id);
    scheduleRakitSync();
    setFormOpen(false);
    setEditing(null);
    load();
  };
  const edit = (idea: Idea) => {
    setEditing(idea);
    setFormOpen(true);
  };
  const visibleIdeas = categoryFilter === "all" ? ideas : ideas.filter((idea) => idea.category === categoryFilter);
  return (
    <MobilePullToRefresh onRefresh={() => syncRakitEditableData().then(load)}><div className="flex flex-1 flex-col gap-3 overflow-x-hidden px-4 pt-12 pb-28 md:gap-4 md:p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Idea</h1>
          <p className="mt-1 text-sm text-muted-foreground">Simpan dan kelola Idea Anda.</p>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          <ToggleGroup type="single" variant="outline" size="sm" value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)} aria-label="Filter kategori Idea">
            <ToggleGroupItem value="all">Semua</ToggleGroupItem>
            {presetIdeaCategories.map((category) => <ToggleGroupItem key={category} value={category}>{category}</ToggleGroupItem>)}
          </ToggleGroup>
          <Button size="sm" variant="ghost" onClick={() => setCategoryFilter("all")}>Reset</Button>
        </div>
      </div>
      <div className="flex items-center gap-1 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto border-b">
          <Button className="h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs font-semibold data-[active=true]:border-primary data-[active=true]:text-primary" type="button" size="sm" variant="ghost" data-active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>Semua</Button>
          {presetIdeaCategories.map((category) => <Button className="h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs font-semibold data-[active=true]:border-primary data-[active=true]:text-primary" key={category} type="button" size="sm" variant="ghost" data-active={categoryFilter === category} onClick={() => setCategoryFilter(category)}>{category}</Button>)}
        </div>
        <Button className="shrink-0 px-2 text-xs" size="sm" variant="ghost" onClick={() => setCategoryFilter("all")}>Reset</Button>
      </div>
      {visibleIdeas.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <Lightbulb className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada Idea.</p>
          </CardContent>
        </Card>
      ) : (<>
        <div className="grid gap-3 md:hidden">
          {visibleIdeas.map((idea) => (
            <Card key={idea.id} className="rounded-2xl py-1">
              <CardContent className="flex items-center gap-3 px-3 py-2">
                <Lightbulb className="size-5 shrink-0 text-muted-foreground" />
                <p className="min-w-0 flex-1 truncate font-medium">{idea.title}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label={`Aksi ${idea.title}`}><MoreHorizontal /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => setViewing(idea)}><Eye />View</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => edit(idea)}><Pencil />Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(idea)}><Trash2 />Hapus</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hidden w-full overflow-x-auto rounded-2xl border bg-card px-4 shadow-sm md:block">
          <Table className="w-full text-sm [&_th]:px-3 [&_th]:py-3 [&_th]:text-center [&_th]:font-semibold [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle">
            <TableHeader><TableRow><TableHead className="w-14 text-center">No.</TableHead><TableHead className="min-w-48 text-center">Judul</TableHead><TableHead className="min-w-28 text-center">Kategori</TableHead><TableHead className="min-w-44 text-center">Konten</TableHead><TableHead className="min-w-32 text-center">Diperbarui</TableHead><TableHead className="min-w-96 text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
          {visibleIdeas.map((idea, index) => (
            <TableRow key={idea.id} className="transition-colors hover:bg-muted/40">
              <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
              <TableCell className="text-center font-medium">{idea.title}</TableCell>
              <TableCell className="text-center"><Badge variant="outline">{idea.category}</Badge></TableCell>
              <TableCell><div className="flex flex-wrap justify-center gap-1">
                    {idea.text_content && (
                      <Badge variant="secondary">Teks</Badge>
                    )}
                    {idea.document_path && (
                      <Badge variant="secondary">Dokumen</Badge>
                    )}
                    {idea.image_path && (
                      <Badge variant="secondary">Gambar</Badge>
                    )}
                    {idea.link_url && <Badge variant="secondary">Link</Badge>}
                  </div></TableCell>
              <TableCell className="text-center text-muted-foreground">{new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                  }).format(new Date(idea.updated_at))}</TableCell>
              <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewing(idea)}
                  >
                    <Eye data-icon="inline-start" />
                    Lihat
                  </Button>
                  {idea.text_content && <Button size="sm" variant="ghost" onClick={() => openIdeaText(idea).catch(console.error)}><FileText data-icon="inline-start" />Notepad</Button>}
                  {idea.document_path && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openItem(idea.document_path!)}
                    >
                      <FileText data-icon="inline-start" />
                      Dokumen
                    </Button>
                  )}
                  {idea.link_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openItem(idea.link_url!, true)}
                    >
                      <ExternalLink data-icon="inline-start" />
                      Link
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => edit(idea)}>
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(idea)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Hapus
                  </Button>
                </div></TableCell>
            </TableRow>
          ))}
            </TableBody>
          </Table>
        </div>
      </>)}
      {!formOpen && !viewing && !deleting && <Button
        className="fixed right-4 bottom-24 z-[60] size-12 rounded-full shadow-lg md:right-6 md:bottom-6"
        size="icon"
        aria-label="Tambah Idea"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus />
      </Button>}
      <Sheet
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detail Idea</SheetTitle>
          </SheetHeader>
          {viewing && (
            <div className="grid gap-4 px-4 pb-4">
              <Badge variant="outline" className="w-fit">
                {viewing.category}
              </Badge>
                {viewing.text_content && (
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {viewing.text_content}
                  </p>
                )}
                {viewing.text_content && <Button variant="outline" onClick={() => openIdeaText(viewing).catch(console.error)}><FileText data-icon="inline-start" />Buka Notepad</Button>}
              {viewing.image_path && (
                <img
                  src={convertFileSrc(viewing.image_path)}
                  alt="Idea tersimpan"
                  className="w-full rounded-md object-contain"
                />
              )}
              {viewing.document_path && (
                <Button
                  variant="outline"
                  onClick={() => openItem(viewing.document_path!)}
                >
                  <FileText data-icon="inline-start" />
                  Buka Dokumen
                </Button>
              )}
              {viewing.link_url && (
                <Button
                  variant="outline"
                  onClick={() => openItem(viewing.link_url!, true)}
                >
                  <Link data-icon="inline-start" />
                  Buka Link
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      {!isAndroid && <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Idea" : "Tambah Idea"}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <IdeaForm
              idea={editing}
              onSubmit={save}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>}
      {isAndroid && <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto p-0 md:hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>{editing ? "Edit Idea" : "Tambah Idea"}</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-5">
            <IdeaForm
              compact
              idea={editing}
              onSubmit={save}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Idea?</AlertDialogTitle>
            <AlertDialogDescription>
              File asal tidak ikut dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleting &&
                deleteIdea(deleting.id).then(() => {
                  scheduleRakitSync();
                  setDeleting(null);
                  load();
                })
              }
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div></MobilePullToRefresh>
  );
}

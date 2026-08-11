import { useEffect, useState } from "react";
import {
  ExternalLink,
  Eye,
  FileText,
  Lightbulb,
  Link,
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
import { IdeaForm } from "@/features/idea/idea-form";
import { openIdeaText } from "@/features/idea/idea-text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  deleteIdea,
  listIdeas,
  saveIdea,
} from "@/features/idea/idea-repository";
import type { Idea, IdeaInput } from "@/features/idea/idea-repository";

const openItem = (path: string, link = false) =>
  (link ? openUrl(path) : openPath(path)).catch(console.error);

export default function IdeaPage() {
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
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Idea</h1>
          <p className="text-muted-foreground">
            Simpan teks, dokumen, gambar, dan link dalam satu Idea.
          </p>
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)} aria-label="Filter kategori Idea">
          <ToggleGroupItem value="all">Semua</ToggleGroupItem>
          {Array.from(new Set(ideas.map((idea) => idea.category))).map((category) => <ToggleGroupItem key={category} value={category}>{category}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      {visibleIdeas.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <Lightbulb className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada Idea.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border bg-card px-4 shadow-sm">
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
      )}
      {!formOpen && !viewing && !deleting && <Button
        className="fixed right-6 bottom-6 z-[60] size-12 rounded-full shadow-lg"
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
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
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
      </Sheet>
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
    </div>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Columns3,
  Eye,
  Archive,
  FolderOpen,
  MessageCircle,
  Pencil,
  NotebookPen,
  Plus,
  Table2,
  Trash2,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { OrderSheet } from "@/features/finance/order-sheet";
import { openProjectBrief } from "@/features/project/project-brief";
import { ProjectCalendar } from "@/features/project/project-calendar";
import { ProjectKanban } from "@/features/project/project-kanban";
import {
  deleteProject,
  archiveProject,
  listProjects,
  saveProject,
  updateProjectPaymentStatus,
  updateProjectStatus,
} from "@/features/project/project-repository";
import type { Project, ProjectInput } from "@/features/project/project-repository";
import { isProjectOverdue, paymentStatusLabels, projectStatusLabels } from "@/features/project/project-status";

type ProjectView = "table" | "kanban" | "calendar";

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function newProjectForm(): ProjectInput {
  return {
    name: "",
    client_name: "",
    client_whatsapp: "",
    brief: "",
    kanban_status: "brief",
    payment_status: "unpaid",
    deadline: "",
    started_at: todayKey(),
  };
}

function ProjectActions({
  project,
  onView,
  onDelete,
  onOrder,
  onBrief,
  onArchive,
}: {
  project: Project;
  onView: (project: Project) => void;
  onDelete: (project: Project) => void;
  onOrder: (project: Project) => void;
  onBrief: (project: Project) => void;
  onArchive: (project: Project) => void;
}) {
  const whatsapp = project.client_whatsapp?.replace(/\D/g, "");
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.startsWith("0") ? `62${whatsapp.slice(1)}` : whatsapp}`
    : null;

  return (
    <div className="flex flex-nowrap items-center justify-end gap-0.5 whitespace-nowrap [&>button]:gap-1 [&>button]:px-1.5">
      <Button variant="ghost" size="sm" aria-label="Buka folder project" disabled={!project.folder_path} onClick={() => project.folder_path && openPath(project.folder_path).catch(console.error)}>
        <FolderOpen data-icon="inline-start" />
        Folder
      </Button>
      <Button variant="ghost" size="sm" aria-label="Tambah pesanan" onClick={() => onOrder(project)}>
        <WalletCards data-icon="inline-start" />
        Pesanan
      </Button>
      <Button variant="ghost" size="sm" aria-label="Buka brief project" onClick={() => onBrief(project)}>
        <NotebookPen data-icon="inline-start" />
        Brief
      </Button>
      <Button variant="ghost" size="sm" aria-label="Chat WhatsApp klien" disabled={!whatsappUrl} onClick={() => whatsappUrl && openUrl(whatsappUrl).catch(console.error)}>
        <MessageCircle data-icon="inline-start" />
        WhatsApp
      </Button>
      <Button variant="ghost" size="sm" aria-label="Lihat project" onClick={() => onView(project)}>
        <Eye data-icon="inline-start" />
        View
      </Button>
      {project.kanban_status === "done" && <Button variant="ghost" size="sm" aria-label="Arsipkan project" onClick={() => onArchive(project)}><Archive data-icon="inline-start" />Arsip</Button>}
      <Button variant="ghost" size="sm" aria-label="Hapus project" onClick={() => onDelete(project)}>
        <Trash2 data-icon="inline-start" />
        Hapus
      </Button>
    </div>
  );
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [archiving, setArchiving] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [orderProject, setOrderProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectInput>(newProjectForm());
  const [view, setView] = useState<ProjectView>("table");
  const hasOpenPopup = open || Boolean(deleting) || Boolean(archiving) || Boolean(detailProject) || Boolean(orderProject);

  const load = () => listProjects().then(setProjects).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await saveProject(form, editing?.id);
    setOpen(false);
    setEditing(null);
    setForm(newProjectForm());
    load();
  };

  const edit = (project: Project) => {
    setEditing(project);
    setForm({
      name: project.name,
      client_name: project.client_name,
      client_whatsapp: project.client_whatsapp ?? "",
      brief: project.brief ?? "",
      kanban_status: project.kanban_status,
      payment_status: project.payment_status,
      deadline: project.deadline ?? "",
      started_at: project.started_at?.slice(0, 10) ?? "",
    });
    setOpen(true);
  };

  const changeStatus = (id: number, status: string) =>
    updateProjectStatus(id, status).then(load).catch(console.error);
  const changePaymentStatus = (id: number, status: string) =>
    updateProjectPaymentStatus(id, status).then(load).catch(console.error);
  const openBrief = (project: Project) => {
    openProjectBrief(project)
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : String(error)));
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 overflow-x-hidden px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Project</h1>
            <p className="text-muted-foreground">Kelola project aktif Anda.</p>
          </div>
          <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(value) => value && setView(value as ProjectView)} aria-label="Pilih tampilan Project">
            <ToggleGroupItem value="table" aria-label="Tampilan tabel"><Table2 data-icon="inline-start" />Table</ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Tampilan Kanban"><Columns3 data-icon="inline-start" />Kanban</ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Tampilan kalender"><CalendarDays data-icon="inline-start" />Calendar</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Sheet open={open} onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setEditing(null);
            setForm(newProjectForm());
          }
        }}>
          {!hasOpenPopup && <Button size="icon" className="fixed right-6 bottom-6 z-[60] size-12 rounded-full shadow-lg" aria-label="Tambah Project" onClick={() => setOpen(true)}>
            <Plus />
          </Button>}
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader className="px-6 pt-6"><SheetTitle>{editing ? "Edit Project" : "Tambah Project"}</SheetTitle></SheetHeader>
            <form onSubmit={submit} className="flex flex-col gap-4 px-6 pb-6">
              <Input required placeholder="Nama project" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input required placeholder="Nama klien" value={form.client_name} onChange={(event) => setForm({ ...form, client_name: event.target.value })} />
              <Input placeholder="Nomor WhatsApp" value={form.client_whatsapp ?? ""} onChange={(event) => setForm({ ...form, client_whatsapp: event.target.value })} />
              <div className="flex gap-4">
                <Input className="scheme-light dark:scheme-dark" type="date" aria-label="Tanggal mulai" value={form.started_at ?? ""} onChange={(event) => setForm({ ...form, started_at: event.target.value })} />
                <Input className="scheme-light dark:scheme-dark" type="date" aria-label="Deadline" value={form.deadline ?? ""} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
              </div>
              <div className="flex gap-4">
                <Select value={form.kanban_status} onValueChange={(value) => setForm({ ...form, kanban_status: value })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Progress" /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="brief">Brief</SelectItem><SelectItem value="concept">Konsep</SelectItem><SelectItem value="revision">Revisi</SelectItem><SelectItem value="finalization">Finalisasi</SelectItem><SelectItem value="done">Selesai</SelectItem></SelectGroup></SelectContent>
                </Select>
                <Select value={form.payment_status} onValueChange={(value) => setForm({ ...form, payment_status: value })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pembayaran" /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="unpaid">Belum Lunas</SelectItem><SelectItem value="deposit">DP</SelectItem><SelectItem value="paid">Lunas</SelectItem></SelectGroup></SelectContent>
                </Select>
              </div>
              <Button type="submit">Simpan Project</Button>
            </form>
          </SheetContent>
        </Sheet>

        {view === "calendar" ? (
          <ProjectCalendar projects={projects} onProjectClick={edit} />
        ) : view === "kanban" ? (
          <ProjectKanban projects={projects} onStatusChange={changeStatus} />
        ) : (
          <div className="w-full overflow-x-hidden rounded-2xl border bg-card px-4 shadow-sm">
            <Table className="w-auto table-auto text-sm [&_th]:px-2 [&_th]:py-3 [&_th]:text-center [&_th]:font-semibold [&_td]:px-2 [&_td]:py-3 [&_td]:text-center">
              <TableHeader><TableRow><TableHead>No</TableHead><TableHead className="w-24">Kode</TableHead><TableHead className="w-40">Project</TableHead><TableHead className="w-[7.5rem]">Klien</TableHead><TableHead className="w-28">Progress</TableHead><TableHead className="w-36">Pembayaran</TableHead><TableHead className="w-28">Mulai</TableHead><TableHead className="w-28">Deadline</TableHead><TableHead className="w-[30rem]">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {projects.map((project, index) => (
                  <TableRow key={project.id} className="transition-colors hover:bg-muted/40">
                    <TableCell>{index + 1}</TableCell><TableCell>{project.code}</TableCell><TableCell>{project.name}</TableCell><TableCell>{project.client_name}</TableCell>
                    <TableCell><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="cursor-pointer"><Badge variant="secondary"><ClipboardList data-icon="inline-start" />{projectStatusLabels[project.kanban_status] ?? project.kanban_status}</Badge></button></DropdownMenuTrigger><DropdownMenuContent align="start">{Object.entries(projectStatusLabels).map(([value, label]) => <DropdownMenuItem key={value} onSelect={() => changeStatus(project.id, value)}>{label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></TableCell>
                    <TableCell><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="cursor-pointer"><Badge variant="outline">{project.payment_status === "paid" ? <BadgeCheck data-icon="inline-start" /> : <CircleDollarSign data-icon="inline-start" />}{paymentStatusLabels[project.payment_status] ?? project.payment_status}</Badge></button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onSelect={() => changePaymentStatus(project.id, "unpaid")}>Belum Lunas</DropdownMenuItem><DropdownMenuItem onSelect={() => changePaymentStatus(project.id, "deposit")}>DP</DropdownMenuItem><DropdownMenuItem onSelect={() => changePaymentStatus(project.id, "paid")}>Lunas</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                    <TableCell>{project.started_at?.slice(0, 10) || "-"}</TableCell>
                    <TableCell><div className="flex items-center justify-center gap-2">{isProjectOverdue(project) && <TriangleAlert aria-label="Deadline lewat" />}<span>{project.deadline || "-"}</span></div></TableCell>
                    <TableCell><ProjectActions project={project} onView={setDetailProject} onDelete={setDeleting} onOrder={setOrderProject} onBrief={openBrief} onArchive={setArchiving} /></TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Belum ada project.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Sheet open={Boolean(detailProject)} onOpenChange={(value) => !value && setDetailProject(null)}>
        <SheetContent className="overflow-y-auto px-8 py-7 sm:max-w-xl">
          <SheetHeader><SheetTitle>Overview Project</SheetTitle></SheetHeader>
          {detailProject && <div className="mt-6 grid gap-5">
            <div className="rounded-xl border bg-muted/40 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{detailProject.code}</p><p className="mt-1 text-xl font-semibold">{detailProject.name}</p><p className="mt-1 text-sm text-muted-foreground">Klien: {detailProject.client_name}</p></div><div className="flex flex-col items-end gap-2"><Badge variant="secondary">{projectStatusLabels[detailProject.kanban_status] ?? detailProject.kanban_status}</Badge><Badge variant="outline">{paymentStatusLabels[detailProject.payment_status] ?? detailProject.payment_status}</Badge></div></div></div>
            <div className="grid grid-cols-2 gap-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Tanggal mulai</p><p className="mt-1 text-sm font-medium">{detailProject.started_at?.slice(0, 10) || "-"}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Deadline</p><p className="mt-1 text-sm font-medium">{detailProject.deadline || "Belum ditentukan"}</p></div><div className="col-span-2 rounded-lg border p-3"><p className="text-xs text-muted-foreground">WhatsApp klien</p><p className="mt-1 text-sm font-medium">{detailProject.client_whatsapp || "Belum diisi"}</p></div><div className="col-span-2 rounded-lg border p-3"><p className="text-xs text-muted-foreground">Folder project</p><p className="mt-1 truncate text-sm font-medium">{detailProject.folder_path || "Belum tersedia"}</p></div></div>
            <div className="rounded-lg border p-4"><p className="text-sm font-medium">Brief Project</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{detailProject.brief ? detailProject.brief.replace(/<[^>]*>/g, "") : "Belum ada brief."}</p></div>
            <div className="flex flex-wrap justify-between gap-2 border-t pt-4"><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!detailProject.folder_path} onClick={() => detailProject.folder_path && openPath(detailProject.folder_path).catch(console.error)}><FolderOpen data-icon="inline-start" />Folder</Button><Button variant="outline" size="sm" disabled={!detailProject.client_whatsapp} onClick={() => { const number = detailProject.client_whatsapp?.replace(/\D/g, ""); if (number) openUrl(`https://wa.me/${number.startsWith("0") ? `62${number.slice(1)}` : number}`).catch(console.error); }}><MessageCircle data-icon="inline-start" />WhatsApp</Button></div><Button onClick={() => { setDetailProject(null); edit(detailProject); }}><Pencil data-icon="inline-start" />Edit Project</Button></div>
          </div>}
        </SheetContent>
      </Sheet>

      <OrderSheet open={Boolean(orderProject)} onOpenChange={(value) => !value && setOrderProject(null)} projects={projects} initialProjectId={orderProject?.id} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus project?</AlertDialogTitle><AlertDialogDescription>Project {deleting?.name} akan dihapus dari daftar beserta folder lokalnya. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (!deleting) return; deleteProject(deleting).then(() => { setDeleting(null); load(); }).catch(console.error); }}>Hapus Project</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={Boolean(archiving)} onOpenChange={(value) => !value && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Arsipkan project?</AlertDialogTitle><AlertDialogDescription>Project {archiving?.name} akan dipindahkan dari daftar Project ke Archive. Folder fisiknya juga dipindahkan ke folder Arsip.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => { if (!archiving) return; archiveProject(archiving).then((result) => { setArchiving(null); if (result.folderMoved) toast.success("Project dan folder berhasil dipindahkan ke Archive."); else { console.warn("Folder Archive belum dapat dipindahkan", result.folderWarning); toast.warning("Project masuk Archive, tetapi folder belum dipindahkan.", { description: "Tutup aplikasi yang memakai file project, lalu coba pindahkan lagi nanti." }); } load(); }).catch((error: unknown) => { setArchiving(null); console.error("Archive gagal", error); toast.error("Project belum dapat diarsipkan. Coba lagi."); }); }}>Arsipkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

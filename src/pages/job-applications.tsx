import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { BriefcaseBusiness, CalendarClock, ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteJobApplication,
  jobApplicationPlatforms,
  jobApplicationStatuses,
  listJobApplications,
  saveJobApplication,
  updateJobApplicationStatus,
  type JobApplication,
  type JobApplicationInput,
  type JobApplicationStatus,
} from "@/features/job-applications/job-application-repository";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);
const defaultInput = (): JobApplicationInput => ({
  company: "",
  position: "",
  platform: "LinkedIn",
  job_url: null,
  applied_at: today(),
  status: "Sudah apply",
  priority: "Normal",
  follow_up_at: null,
  contact_name: null,
  contact_info: null,
  salary_range: null,
  notes: null,
  cv_ready: 0,
  portfolio_ready: 0,
  cover_letter_ready: 0,
  follow_up_sent: 0,
});

const statusTone: Record<JobApplicationStatus, string> = {
  "Belum apply": "bg-muted text-muted-foreground",
  "Sudah apply": "bg-primary/15 text-primary",
  Screening: "bg-sky-500/15 text-sky-300",
  Interview: "bg-violet-500/15 text-violet-300",
  Tes: "bg-amber-500/15 text-amber-300",
  Offering: "bg-emerald-500/15 text-emerald-300",
  Diterima: "bg-green-500/15 text-green-300",
  Ditolak: "bg-destructive/15 text-destructive",
};

const processStatuses: JobApplicationStatus[] = ["Belum apply", "Sudah apply", "Screening", "Interview", "Tes", "Offering"];
const finalStatuses: JobApplicationStatus[] = ["Diterima", "Ditolak"];
const checklistItems = [
  { key: "cv_ready", label: "CV" },
  { key: "portfolio_ready", label: "Portfolio" },
  { key: "cover_letter_ready", label: "Surat lamaran" },
  { key: "follow_up_sent", label: "Follow-up terkirim" },
] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function isFollowUpDue(value: string | null) {
  return Boolean(value && value <= today());
}

function toInput(application: JobApplication): JobApplicationInput {
  return {
    company: application.company,
    position: application.position,
    platform: application.platform,
    job_url: application.job_url,
    applied_at: application.applied_at,
    status: application.status,
    priority: application.priority,
    follow_up_at: application.follow_up_at,
    contact_name: application.contact_name,
    contact_info: application.contact_info,
    salary_range: application.salary_range,
    notes: application.notes,
    cv_ready: application.cv_ready,
    portfolio_ready: application.portfolio_ready,
    cover_letter_ready: application.cover_letter_ready,
    follow_up_sent: application.follow_up_sent,
  };
}

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [viewing, setViewing] = useState<JobApplication | null>(null);
  const [deleting, setDeleting] = useState<JobApplication | null>(null);
  const [draft, setDraft] = useState<JobApplicationInput>(defaultInput);

  const load = () => listJobApplications().then(setApplications).catch(console.error);
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      const haystack = `${application.company} ${application.position} ${application.platform} ${application.notes ?? ""}`.toLowerCase();
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [applications, query, statusFilter]);

  const dueFollowUps = useMemo(() => {
    const currentDate = today();
    return applications
      .filter((item) => item.follow_up_at && item.follow_up_at <= currentDate && !["Diterima", "Ditolak"].includes(item.status))
      .sort((a, b) => (a.follow_up_at ?? "").localeCompare(b.follow_up_at ?? ""));
  }, [applications]);

  const stats = [
    { label: "Total lamaran", value: applications.length },
    { label: "Proses aktif", value: applications.filter((item) => !["Diterima", "Ditolak"].includes(item.status)).length },
    { label: "Interview / Tes", value: applications.filter((item) => item.status === "Interview" || item.status === "Tes").length },
    { label: "Perlu follow-up", value: dueFollowUps.length },
  ];

  const openForm = (application?: JobApplication) => {
    setViewing(null);
    setEditing(application ?? null);
    setDraft(application ? toInput(application) : defaultInput());
    setFormOpen(true);
  };

  const save = async () => {
    if (!draft.company.trim() || !draft.position.trim()) return;
    await saveJobApplication(draft, editing?.id);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const changeStatus = async (application: JobApplication, status: JobApplicationStatus) => {
    if (application.status === status) return;
    await updateJobApplicationStatus(application.id, status);
    load();
  };

  return (
    <main className="flex flex-1 flex-col gap-5 p-4 pb-24 md:p-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lamar Pekerjaan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pantau peluang kerja, follow-up, interview, sampai offering dalam satu tempat.</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus data-icon="inline-start" />Tambah Lamaran
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="gap-2 py-4">
            <CardHeader className="px-4">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      {dueFollowUps.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="flex-row items-center gap-3">
            <CalendarClock className="text-primary" />
            <div>
              <CardTitle>Follow-up hari ini</CardTitle>
              <CardDescription>Lamaran yang sudah masuk jadwal tindak lanjut.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {dueFollowUps.slice(0, 6).map((item) => (
              <button
                key={item.id}
                className="rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/60"
                type="button"
                onClick={() => setViewing(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.position}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.company}</p>
                  </div>
                  <Badge className={statusTone[item.status]}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Follow-up: {formatDate(item.follow_up_at)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-2 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari perusahaan, posisi, platform..." />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {jobApplicationStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => { setQuery(""); setStatusFilter("all"); }}>Reset</Button>
      </section>

      <JobPipeline
        applications={filtered}
        onView={setViewing}
        onStatusChange={changeStatus}
      />

      <Card className="hidden gap-0 overflow-hidden md:flex">
        <CardHeader>
          <CardTitle>Daftar lamaran</CardTitle>
          <CardDescription>{filtered.length} lamaran ditampilkan.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-4 pb-4">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perusahaan</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Apply</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((application) => (
              <TableRow key={application.id}>
                <TableCell><div><p className="font-medium">{application.company}</p><p className="text-xs text-muted-foreground">{application.platform}</p></div></TableCell>
                <TableCell>{application.position}</TableCell>
                <TableCell><StatusMenu application={application} onChange={changeStatus} /></TableCell>
                <TableCell>{formatDate(application.applied_at)}</TableCell>
                <TableCell>{formatDate(application.follow_up_at)}</TableCell>
                <TableCell className="text-right"><RowActions application={application} onEdit={openForm} onDelete={setDeleting} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>Belum ada lamaran pada filter ini.</TableCell></TableRow>}
          </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-3 md:hidden">
        {filtered.map((application) => (
          <Card key={application.id}>
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{application.position}</p>
                  <p className="truncate text-sm text-muted-foreground">{application.company}</p>
                </div>
                <RowActions application={application} onEdit={openForm} onDelete={setDeleting} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={statusTone[application.status]}>{application.status}</Badge>
                <Badge variant="outline">{application.platform}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Apply: {formatDate(application.applied_at)}</span>
                <span>Follow-up: {formatDate(application.follow_up_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="flex min-h-44 flex-col items-center justify-center gap-2 text-center"><BriefcaseBusiness className="text-muted-foreground" /><p className="text-sm text-muted-foreground">Belum ada lamaran.</p></CardContent></Card>
        )}
      </section>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail lamaran</DialogTitle>
          </DialogHeader>
          {viewing && <JobApplicationDetail application={viewing} />}
          {viewing && false && (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={statusTone[viewing!.status]}>{viewing!.status}</Badge>
                <Badge variant="outline">{viewing!.platform}</Badge>
              </div>
              <Card className="gap-3 bg-background py-4">
                <CardContent className="grid gap-3 px-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Perusahaan</p>
                    <p className="font-medium">{viewing!.company}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tanggal apply</p>
                    <p className="font-medium">{formatDate(viewing!.applied_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Follow-up</p>
                    <p className="font-medium">{formatDate(viewing!.follow_up_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kontak</p>
                    <p className="font-medium">{[viewing!.contact_name, viewing!.contact_info].filter(Boolean).join(" · ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Link lowongan</p>
                    <p className="truncate font-medium">{viewing!.job_url || "-"}</p>
                  </div>
                </CardContent>
              </Card>
              {viewing!.notes && (
                <div className="rounded-xl border bg-background p-4">
                  <p className="mb-2 text-sm font-medium">Catatan</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{viewing!.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {viewing?.job_url && (
              <Button variant="outline" onClick={() => openUrl(viewing!.job_url!).catch(console.error)}>
                <ExternalLink data-icon="inline-start" />
                Buka lowongan
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewing(null)}>Tutup</Button>
            {viewing && <Button onClick={() => openForm(viewing)}><Pencil data-icon="inline-start" />Edit</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lamaran" : "Tambah Lamaran"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2.5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">Perusahaan<Input value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} placeholder="Nama perusahaan" /></label>
              <label className="grid gap-2 text-sm font-medium">Posisi<Input value={draft.position} onChange={(event) => setDraft({ ...draft, position: event.target.value })} placeholder="UI Designer, Frontend..." /></label>
              <label className="grid gap-2 text-sm font-medium">Platform<Select value={draft.platform} onValueChange={(value) => setDraft({ ...draft, platform: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{jobApplicationPlatforms.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent></Select></label>
              <label className="grid gap-2 text-sm font-medium">Status<Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as JobApplicationStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{jobApplicationStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></label>
              <label className="grid gap-2 text-sm font-medium">Tanggal apply<Input className="scheme-light dark:scheme-dark" type="date" value={draft.applied_at} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setDraft({ ...draft, applied_at: event.target.value })} /></label>
              <label className="grid gap-2 text-sm font-medium">Follow-up<Input className="scheme-light dark:scheme-dark" type="date" value={draft.follow_up_at ?? ""} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setDraft({ ...draft, follow_up_at: event.target.value || null })} /></label>
              <label className="grid gap-2 text-sm font-medium">Nama kontak<Input value={draft.contact_name ?? ""} onChange={(event) => setDraft({ ...draft, contact_name: event.target.value || null })} placeholder="HR / recruiter" /></label>
              <label className="grid gap-2 text-sm font-medium">Kontak<Input value={draft.contact_info ?? ""} onChange={(event) => setDraft({ ...draft, contact_info: event.target.value || null })} placeholder="Email, WA, LinkedIn" /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium">Link lowongan<Input value={draft.job_url ?? ""} onChange={(event) => setDraft({ ...draft, job_url: event.target.value || null })} placeholder="https://..." /></label>
            <div className="grid gap-2 rounded-xl border bg-background p-3">
              <div>
                <p className="text-sm font-medium">Checklist persiapan</p>
                <p className="text-xs text-muted-foreground">Tandai bahan yang sudah siap untuk lamaran ini.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {checklistItems.map((item) => (
                  <label key={item.key} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                    <Checkbox
                      checked={Boolean(draft[item.key])}
                      onCheckedChange={(checked) => setDraft({ ...draft, [item.key]: checked ? 1 : 0 })}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">Catatan<Textarea rows={2} value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value || null })} placeholder="Catatan interview, kebutuhan CV, follow-up..." /></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={!draft.company.trim() || !draft.position.trim()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus lamaran?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.company} - {deleting?.position} akan dihapus dari daftar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleting && deleteJobApplication(deleting.id).then(() => { setDeleting(null); load(); })}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function StatusMenu({ application, onChange }: { application: JobApplication; onChange: (application: JobApplication, status: JobApplicationStatus) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button"><Badge className={statusTone[application.status]}>{application.status}</Badge></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {jobApplicationStatuses.map((status) => <DropdownMenuItem key={status} onSelect={() => onChange(application, status)}>{status}</DropdownMenuItem>)}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InfoBlock({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn("font-medium", truncate && "truncate")}>{value}</p>
    </div>
  );
}

function JobApplicationDetail({ application }: { application: JobApplication }) {
  const completedChecklist = checklistItems.filter((item) => application[item.key]).length;

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border bg-background p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{application.company}</p>
            <h2 className="mt-1 truncate text-xl font-semibold">{application.position}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className={statusTone[application.status]}>{application.status}</Badge>
              <Badge variant="outline">{application.platform}</Badge>
            </div>
          </div>
          {application.job_url && (
            <Button variant="outline" onClick={() => openUrl(application.job_url!).catch(console.error)}>
              <ExternalLink data-icon="inline-start" />
              Buka web
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="gap-1 bg-background py-3">
          <CardHeader className="px-3">
            <CardDescription>Tanggal apply</CardDescription>
            <CardTitle className="text-base">{formatDate(application.applied_at)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("gap-1 bg-background py-3", isFollowUpDue(application.follow_up_at) && "border-primary/50")}>
          <CardHeader className="px-3">
            <CardDescription>Follow-up</CardDescription>
            <CardTitle className="text-base">{formatDate(application.follow_up_at)}</CardTitle>
            {isFollowUpDue(application.follow_up_at) && <Badge variant="secondary">Perlu ditindaklanjuti</Badge>}
          </CardHeader>
        </Card>
      </div>

      <Card className="gap-2 bg-background py-3">
        <CardHeader className="px-3">
          <CardTitle className="text-base">Informasi lanjutan</CardTitle>
          <CardDescription>Kontak, link, dan bahan follow-up.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 px-3 text-sm md:grid-cols-2">
          <InfoBlock label="Kontak recruiter" value={[application.contact_name, application.contact_info].filter(Boolean).join(" · ") || "-"} />
          <InfoBlock label="Link lowongan" value={application.job_url || "-"} truncate />
          <InfoBlock label="Platform" value={application.platform} />
          <InfoBlock label="Status saat ini" value={application.status} />
        </CardContent>
      </Card>

      <Card className="gap-2 bg-background py-3">
        <CardHeader className="px-3">
          <CardTitle className="text-base">Checklist persiapan</CardTitle>
          <CardDescription>{completedChecklist} dari {checklistItems.length} sudah siap.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 px-3 md:grid-cols-2">
          {checklistItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
              <Checkbox checked={Boolean(application[item.key])} disabled />
              <span className={cn(!application[item.key] && "text-muted-foreground")}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className={cn("rounded-xl border bg-background p-3", !application.notes && "border-dashed")}>
        <p className="mb-1 text-sm font-medium">Catatan</p>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{application.notes || "Belum ada catatan untuk lamaran ini."}</p>
      </div>
    </div>
  );
}

function JobPipeline({
  applications,
  onView,
  onStatusChange,
}: {
  applications: JobApplication[];
  onView: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: JobApplicationStatus) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const application = active.data.current?.application as JobApplication | undefined;
    const status = over?.id as JobApplicationStatus | undefined;
    if (application && status && jobApplicationStatuses.includes(status)) {
      onStatusChange(application, status);
    }
  };

  return (
    <Card>
      <CardHeader className="md:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Pipeline lamaran</CardTitle>
          <CardDescription>Tarik kartu ke kolom lain untuk mengubah status proses.</CardDescription>
        </div>
        <Badge variant="secondary">{applications.length} lamaran</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {processStatuses.map((status) => (
              <JobPipelineColumn
                key={status}
                status={status}
                applications={applications.filter((item) => item.status === status)}
                onView={onView}
              />
            ))}
          </div>
          <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
            {finalStatuses.map((status) => (
              <JobPipelineColumn
                key={status}
                compact
                status={status}
                applications={applications.filter((item) => item.status === status)}
                onView={onView}
              />
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}

function JobPipelineColumn({
  status,
  applications,
  onView,
  compact,
}: {
  status: JobApplicationStatus;
  applications: JobApplication[];
  onView: (application: JobApplication) => void;
  compact?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-background p-3 transition-colors",
        compact ? "min-h-36" : "min-h-44",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-sm font-semibold">{status}</h2>
        <Badge variant="secondary">{applications.length}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {applications.slice(0, compact ? 3 : 4).map((application) => (
          <JobPipelineCard key={application.id} application={application} onView={onView} />
        ))}
        {applications.length > (compact ? 3 : 4) && <p className="text-xs text-muted-foreground">+{applications.length - (compact ? 3 : 4)} lamaran lainnya</p>}
        {applications.length === 0 && <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Kosong</p>}
      </div>
    </section>
  );
}

function JobPipelineCard({
  application,
  onView,
}: {
  application: JobApplication;
  onView: (application: JobApplication) => void;
}) {
  const completedChecklist = checklistItems.filter((item) => application[item.key]).length;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/60",
        isDragging ? "cursor-grabbing opacity-50" : "cursor-grab",
      )}
      type="button"
      onClick={() => onView(application)}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{application.position}</p>
          <p className="truncate text-xs text-muted-foreground">{application.company}</p>
        </div>
      </div>
      {application.follow_up_at && (
        <p className="mt-2 text-xs text-muted-foreground">Follow-up: {formatDate(application.follow_up_at)}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Checklist: {completedChecklist}/{checklistItems.length}</p>
    </button>
  );
}

function RowActions({ application, onEdit, onDelete }: { application: JobApplication; onEdit: (application: JobApplication) => void; onDelete: (application: JobApplication) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Aksi ${application.company}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {application.job_url && <DropdownMenuItem onSelect={() => openUrl(application.job_url!).catch(console.error)}><ExternalLink />Buka lowongan</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => onEdit(application)}><Pencil />Edit</DropdownMenuItem>
          {application.follow_up_at && <DropdownMenuItem onSelect={() => onEdit(application)}><CalendarClock />Follow-up {formatDate(application.follow_up_at)}</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(application)}><Trash2 />Hapus</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

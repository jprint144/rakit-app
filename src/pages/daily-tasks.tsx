import { useEffect, useState } from "react";
import {
  ListTodo,
  MoreHorizontal,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MobilePullToRefresh } from "@/components/mobile-pull-to-refresh";
import { scheduleRakitSync, syncRakitEditableData } from "@/features/sync/supabase-sync";
import { sendDailyTaskTestNotification } from "@/features/tugas-harian/daily-task-reminder";
import { toast } from "sonner";
import {
  deleteDailyTask,
  listDailyTasks,
  saveDailyTask,
  setDailyTaskCompleted,
  taskPriorities,
  type DailyTask,
  type DailyTaskInput,
  type TaskPriority,
} from "@/features/tugas-harian/daily-task-repository";

type StatusFilter = "all" | "open" | "done";
type WeekdayFilter = "all" | 0 | 1 | 2 | 3 | 4 | 5 | 6;

const weekdays: { label: string; value: Exclude<WeekdayFilter, "all"> }[] = [
  { label: "Senin", value: 1 },
  { label: "Selasa", value: 2 },
  { label: "Rabu", value: 3 },
  { label: "Kamis", value: 4 },
  { label: "Jumat", value: 5 },
  { label: "Sabtu", value: 6 },
  { label: "Minggu", value: 0 },
];

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function defaultTask(): DailyTaskInput {
  return {
    title: "",
    notes: "",
    task_date: localDate(),
    task_time: "",
    priority: "Normal",
    category: "Pribadi",
    reminder_at: "",
  };
}

function toTaskInput(task: DailyTask): DailyTaskInput {
  return {
    title: task.title,
    notes: task.notes ?? "",
    task_date: task.task_date,
    task_time: task.task_time ?? "",
    priority: task.priority,
    category: task.category,
    reminder_at: task.reminder_at ?? "",
  };
}

export default function DailyTasksPage() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [viewingNote, setViewingNote] = useState<DailyTask | null>(null);
  const [deleting, setDeleting] = useState<DailyTask | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [weekdayFilter, setWeekdayFilter] = useState<WeekdayFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const taskCategories = [...new Set(tasks.map((task) => task.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));

  const load = () => listDailyTasks().then(setTasks).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const visibleTasks = tasks.filter((task) =>
    (!dateFilter || task.task_date === dateFilter)
    && (categoryFilter === "all" || task.category === categoryFilter)
    && (priorityFilter === "all" || task.priority === priorityFilter)
    && (weekdayFilter === "all" || new Date(`${task.task_date}T00:00:00`).getDay() === weekdayFilter)
    && (statusFilter === "all" || (statusFilter === "done" ? task.completed === 1 : task.completed === 0)),
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (task: DailyTask) => {
    setEditing(task);
    setFormOpen(true);
  };
  const toggleComplete = async (task: DailyTask) => {
    await setDailyTaskCompleted(task.id, task.completed !== 1);
    scheduleRakitSync();
    load();
  };
  const save = async (input: DailyTaskInput) => {
    await saveDailyTask(input, editing?.id);
    scheduleRakitSync();
    setFormOpen(false);
    setEditing(null);
    load();
  };
  const resetFilters = () => {
    setDateFilter("");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setWeekdayFilter("all");
    setStatusFilter("open");
  };

  const remove = async (id: number) => {
    await deleteDailyTask(id);
    scheduleRakitSync();
    setDeleting(null);
    load();
  };

  return (
    <MobilePullToRefresh onRefresh={() => syncRakitEditableData().then(load)}>
    <div className="flex flex-1 flex-col gap-3 overflow-x-hidden px-4 pt-12 pb-28 md:gap-5 md:px-8 md:py-5 md:pb-5">
      <div className="hidden md:block">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Tugas Harian</h1>
            <p className="text-xs text-muted-foreground md:text-sm">Catat aktivitas pribadi dan pekerjaan harian di luar Project.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />Tambah tugas
          </Button>
        </div>
      </div>

      <Card className="hidden min-w-0 gap-3 py-4 shadow-sm md:flex">
        <CardContent className="grid min-w-0 gap-4 px-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="task-date-filter">Tanggal</label><Input id="task-date-filter" type="date" value={dateFilter} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setDateFilter(event.target.value)} /></div>
            <div className="grid gap-1.5"><label className="text-sm font-medium">Kategori</label><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">Semua kategori</SelectItem>{taskCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
            <div className="grid gap-1.5"><label className="text-sm font-medium">Prioritas</label><Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "all" | TaskPriority)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">Semua prioritas</SelectItem>{taskPriorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
          </div>
          <div className="flex flex-wrap items-center gap-3"><div className="flex flex-wrap items-center gap-2">{([{ label: "Semua", value: "all" }, ...weekdays] as { label: string; value: WeekdayFilter }[]).map((day) => <Button key={day.value} type="button" size="sm" variant={weekdayFilter === day.value ? "default" : "outline"} onClick={() => setWeekdayFilter(day.value)}>{day.label}</Button>)}</div><div className="flex flex-wrap items-center gap-2 border-l pl-4">{([{ label: "Belum selesai", value: "open" }, { label: "Selesai", value: "done" }, { label: "Semua status", value: "all" }] as { label: string; value: StatusFilter }[]).map((status) => <Button key={status.value} type="button" size="sm" variant={statusFilter === status.value ? "default" : "outline"} onClick={() => setStatusFilter(status.value)}>{status.label}</Button>)}</div><Button className="ml-auto" type="button" variant="ghost" size="sm" onClick={resetFilters}>Reset filter</Button></div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3 md:hidden">
        <div className="flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">Tugas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Atur aktivitas harian Anda.</p>
          </div>
          <Button className="shrink-0" size="sm" onClick={openCreate}>
            <Plus data-icon="inline-start" />Tambah
          </Button>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto border-b px-1">
          <Button className="relative h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs font-semibold data-[active=true]:border-primary data-[active=true]:text-primary" type="button" size="sm" variant="ghost" data-active={weekdayFilter === "all"} onClick={() => setWeekdayFilter("all")}>Semua</Button>
          {weekdays.map((day) => (
            <Button className="relative h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs font-semibold data-[active=true]:border-primary data-[active=true]:text-primary" key={day.value} type="button" size="sm" variant="ghost" data-active={weekdayFilter === day.value} onClick={() => setWeekdayFilter(day.value)}>
              {day.label}
              {tasks.filter((task) => new Date(`${task.task_date}T00:00:00`).getDay() === day.value && task.completed === 0).length > 0 && <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tasks.filter((task) => new Date(`${task.task_date}T00:00:00`).getDay() === day.value && task.completed === 0).length}</span>}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <Button className="px-2 text-xs" type="button" size="sm" variant={statusFilter === "open" ? "secondary" : "ghost"} onClick={() => setStatusFilter("open")}>Belum selesai</Button>
          <Button className="px-2 text-xs" type="button" size="sm" variant={statusFilter === "done" ? "secondary" : "ghost"} onClick={() => setStatusFilter("done")}>Selesai</Button>
          <Button className="px-2 text-xs" type="button" size="sm" variant={statusFilter === "all" ? "secondary" : "ghost"} onClick={() => setStatusFilter("all")}>Semua</Button>
          <Button className="ml-auto px-2 text-xs" type="button" size="sm" variant="ghost" onClick={resetFilters}>Reset</Button>
        </div>
      </section>

      {visibleTasks.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex min-h-32 flex-col items-center justify-center gap-2 py-8 text-center">
            <ListTodo className="size-8 text-muted-foreground" />
            <p className="font-medium">Belum ada tugas pada filter ini.</p>
            <p className="text-sm text-muted-foreground">Tambahkan tugas baru untuk mulai mencatat aktivitas harian.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {visibleTasks.map((task) => (
              <Card key={task.id} className={task.completed ? "gap-0 rounded-2xl py-1 shadow-sm opacity-70" : "gap-0 rounded-2xl py-1 shadow-sm"}>
                <CardContent className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    className="size-5 shrink-0 rounded-full border-2 border-foreground"
                    checked={Boolean(task.completed)}
                    aria-label={task.completed ? "Batalkan selesai" : "Tandai selesai"}
                    onCheckedChange={() => void toggleComplete(task)}
                  />
                  <p className={task.completed ? "min-w-0 flex-1 truncate font-medium line-through" : "min-w-0 flex-1 truncate font-medium"}>{task.title}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={`Aksi ${task.title}`}><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => setViewingNote(task)}><Eye />View</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(task)}><Pencil />Edit</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(task)}><Trash2 />Hapus</DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden w-full overflow-x-hidden rounded-2xl border bg-card px-4 shadow-sm md:block">
            <Table className="w-auto table-auto text-sm [&_th]:px-2 [&_th]:py-3 [&_th]:text-center [&_th]:font-semibold [&_td]:px-2 [&_td]:py-3 [&_td]:text-center">
            <TableHeader>
              <TableRow>
                <TableHead>Selesai</TableHead>
                <TableHead className="w-48 !text-left">Tugas</TableHead>
                <TableHead className="w-60">Catatan</TableHead>
                <TableHead className="w-28">Prioritas</TableHead>
                <TableHead className="w-28">Kategori</TableHead>
                <TableHead className="w-36">Jadwal</TableHead>
                <TableHead className="w-44">Pengingat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTasks.map((task) => (
                <TableRow key={task.id} className={task.completed ? "opacity-70" : "transition-colors hover:bg-muted/40"}>
                  <TableCell>
                    <Checkbox className="size-5 rounded-none border-2 border-foreground" checked={Boolean(task.completed)} aria-label={task.completed ? "Batalkan selesai" : "Tandai selesai"} onCheckedChange={() => void toggleComplete(task)} />
                  </TableCell>
                  <TableCell className={task.completed ? "!text-left font-medium line-through" : "!text-left font-medium"}>{task.title}</TableCell>
                  <TableCell>
                    {task.notes ? <Button size="sm" variant="ghost" onClick={() => setViewingNote(task)}>Lihat catatan</Button> : "-"}
                  </TableCell>
                  <TableCell><Badge variant="outline">{task.priority}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{task.category}</Badge></TableCell>
                  <TableCell>{task.task_date}{task.task_time ? ` · ${task.task_time}` : ""}</TableCell>
                  <TableCell>{task.reminder_at ? new Date(task.reminder_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}</TableCell>
                  <TableCell><Badge variant={task.completed ? "secondary" : "outline"}>{task.completed ? "Selesai" : "Belum selesai"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" variant="ghost" aria-label="Edit tugas" onClick={() => openEdit(task)}><Pencil /></Button>
                      <Button size="icon" variant="ghost" aria-label="Hapus tugas" onClick={() => setDeleting(task)}><Trash2 /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </>
      )}

      {!isAndroid && <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>{editing ? "Edit tugas" : "Tambah tugas"}</SheetTitle></SheetHeader>
          <div className="px-4 pb-8"><DailyTaskForm task={editing ? toTaskInput(editing) : defaultTask()} onCancel={() => setFormOpen(false)} onSubmit={save} /></div>
        </SheetContent>
      </Sheet>}

      {isAndroid && <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto p-0 md:hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>{editing ? "Edit tugas" : "Tambah tugas"}</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-5"><DailyTaskForm compact task={editing ? toTaskInput(editing) : defaultTask()} onCancel={() => setFormOpen(false)} onSubmit={save} /></div>
        </DialogContent>
      </Dialog>}

      <Dialog open={Boolean(viewingNote)} onOpenChange={(open) => !open && setViewingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail tugas</DialogTitle>
            <DialogDescription>{viewingNote?.title}</DialogDescription>
          </DialogHeader>
          {viewingNote && <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-muted-foreground">
              <div><p className="text-xs">Tanggal</p><p className="mt-1 font-medium text-foreground">{viewingNote.task_date}</p></div>
              <div><p className="text-xs">Jam</p><p className="mt-1 font-medium text-foreground">{viewingNote.task_time || "-"}</p></div>
              <div><p className="text-xs">Prioritas</p><p className="mt-1 font-medium text-foreground">{viewingNote.priority}</p></div>
              <div><p className="text-xs">Kategori</p><p className="mt-1 font-medium text-foreground">{viewingNote.category}</p></div>
            </div>
            {viewingNote.notes && <div><p className="mb-1 text-xs text-muted-foreground">Catatan</p><p className="whitespace-pre-wrap leading-6">{viewingNote.notes}</p></div>}
          </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus tugas?</AlertDialogTitle><AlertDialogDescription>Tugas “{deleting?.title}” akan dihapus dari semua perangkat saat sinkronisasi berikutnya.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && void remove(deleting.id)}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </MobilePullToRefresh>
  );
}

function DailyTaskForm({ task, onSubmit, onCancel, compact = false }: { task: DailyTaskInput; onSubmit: (input: DailyTaskInput) => Promise<void>; onCancel: () => void; compact?: boolean }) {
  const [input, setInput] = useState(task);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.title.trim()) return;
    setSaving(true);
    try { await onSubmit(input); } finally { setSaving(false); }
  };

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium">Judul tugas<Input autoFocus required value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="Contoh: Susun konten Instagram" /></label>
      <label className="grid gap-1 text-sm font-medium">Catatan<Textarea rows={2} value={input.notes ?? ""} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Detail atau konteks tugas (opsional)" /></label>
      {!compact && <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Tanggal<Input className="scheme-light dark:scheme-dark" type="date" required value={input.task_date} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setInput({ ...input, task_date: event.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">Jam<Input type="time" value={input.task_time ?? ""} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setInput({ ...input, task_time: event.target.value })} /></label>
      </div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Prioritas
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={input.priority} onChange={(event) => setInput({ ...input, priority: event.target.value as TaskPriority })}>
            {taskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">Kategori<Input value={input.category} onChange={(event) => setInput({ ...input, category: event.target.value })} placeholder="Pribadi" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Waktu pengingat<Input type="datetime-local" value={input.reminder_at ?? ""} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setInput({ ...input, reminder_at: event.target.value })} /></label>
      <div className="flex items-center justify-between gap-2"><Button className="hidden md:inline-flex" type="button" variant="ghost" onClick={() => void sendDailyTaskTestNotification().then((sent) => sent ? toast.success("Notifikasi tes sudah dikirim.") : toast.error("Izin notifikasi belum diberikan."))}>Tes notifikasi</Button><div className="flex gap-2"><Button type="button" variant="outline" onClick={onCancel}>Batal</Button><Button type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan tugas"}</Button></div></div>
    </form>
  );
}

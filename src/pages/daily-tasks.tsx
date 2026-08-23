import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [deleting, setDeleting] = useState<DailyTask | null>(null);
  const [dateFilter, setDateFilter] = useState(localDate());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");

  const load = () => listDailyTasks().then(setTasks).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => [...new Set(tasks.map((task) => task.category))].sort((a, b) => a.localeCompare(b, "id")),
    [tasks],
  );
  const visibleTasks = tasks.filter((task) =>
    (dateFilter === "all" || task.task_date === dateFilter)
    && (categoryFilter === "all" || task.category === categoryFilter)
    && (priorityFilter === "all" || task.priority === priorityFilter)
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
    load();
  };
  const save = async (input: DailyTaskInput) => {
    await saveDailyTask(input, editing?.id);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold">Tugas Harian</h1>
          <p className="text-muted-foreground">Catat aktivitas pribadi dan pekerjaan harian di luar Project.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />Tambah tugas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter tugas</CardTitle>
          <CardDescription>Pilih tanggal, kategori, prioritas, atau status yang ingin dilihat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium">Tanggal
            <Input type="date" value={dateFilter === "all" ? "" : dateFilter} onChange={(event) => setDateFilter(event.target.value || "all")} />
          </label>
          <label className="grid gap-1 text-sm font-medium">Kategori
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Semua kategori</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">Prioritas
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="all">Semua prioritas</option>
              {taskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">Status
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="open">Belum selesai</option>
              <option value="done">Selesai</option>
              <option value="all">Semua status</option>
            </select>
          </label>
        </CardContent>
      </Card>

      {visibleTasks.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <ListTodo className="size-10 text-muted-foreground" />
            <p className="font-medium">Belum ada tugas pada filter ini.</p>
            <p className="text-sm text-muted-foreground">Tambahkan tugas baru untuk mulai mencatat aktivitas harian.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visibleTasks.map((task) => (
            <Card key={task.id} className={task.completed ? "opacity-70" : undefined}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <Button size="icon" variant="ghost" aria-label={task.completed ? "Batalkan selesai" : "Tandai selesai"} onClick={() => void toggleComplete(task)}>
                  {task.completed ? <CheckCircle2 /> : <Circle />}
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={task.completed ? "font-medium line-through" : "font-medium"}>{task.title}</p>
                    <Badge variant="outline">{task.priority}</Badge>
                    <Badge variant="secondary">{task.category}</Badge>
                  </div>
                  {task.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{task.notes}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />{task.task_date}{task.task_time ? ` · ${task.task_time}` : ""}</span>
                    {task.reminder_at && <span className="inline-flex items-center gap-1"><Bell className="size-4" />{new Date(task.reminder_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>}
                  </div>
                </div>
                <div className="flex gap-1 self-end sm:self-auto">
                  <Button size="icon" variant="ghost" aria-label="Edit tugas" onClick={() => openEdit(task)}><Pencil /></Button>
                  <Button size="icon" variant="ghost" aria-label="Hapus tugas" onClick={() => setDeleting(task)}><Trash2 /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? "Edit tugas" : "Tambah tugas"}</SheetTitle></SheetHeader>
          <div className="px-4 pb-4"><DailyTaskForm task={editing ? toTaskInput(editing) : defaultTask()} onCancel={() => setFormOpen(false)} onSubmit={save} /></div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus tugas?</AlertDialogTitle><AlertDialogDescription>Tugas “{deleting?.title}” akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && void deleteDailyTask(deleting.id).then(() => { setDeleting(null); load(); })}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DailyTaskForm({ task, onSubmit, onCancel }: { task: DailyTaskInput; onSubmit: (input: DailyTaskInput) => Promise<void>; onCancel: () => void }) {
  const [input, setInput] = useState(task);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.title.trim()) return;
    setSaving(true);
    try { await onSubmit(input); } finally { setSaving(false); }
  };

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium">Judul tugas<Input autoFocus required value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="Contoh: Susun konten Instagram" /></label>
      <label className="grid gap-1 text-sm font-medium">Catatan<Textarea value={input.notes ?? ""} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Detail atau konteks tugas (opsional)" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Tanggal<Input type="date" required value={input.task_date} onChange={(event) => setInput({ ...input, task_date: event.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">Jam<Input type="time" value={input.task_time ?? ""} onChange={(event) => setInput({ ...input, task_time: event.target.value })} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Prioritas
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={input.priority} onChange={(event) => setInput({ ...input, priority: event.target.value as TaskPriority })}>
            {taskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">Kategori<Input value={input.category} onChange={(event) => setInput({ ...input, category: event.target.value })} placeholder="Pribadi" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Waktu pengingat<Input type="datetime-local" value={input.reminder_at ?? ""} onChange={(event) => setInput({ ...input, reminder_at: event.target.value })} /></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Batal</Button><Button type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan tugas"}</Button></div>
    </form>
  );
}

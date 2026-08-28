import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Ellipsis, Gift, Pencil, Plus, RotateCcw, Search, Target, Trash2, Trophy, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { MobilePullToRefresh } from "@/components/mobile-pull-to-refresh";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePersonalTarget,
  listPersonalTargets,
  listPersonalTargetSteps,
  savePersonalTarget,
  savePersonalTargetSteps,
  targetCategories,
  targetPriorities,
  targetStatuses,
  type PersonalTarget,
  type PersonalTargetInput,
  type PersonalTargetStep,
  type PersonalTargetStepInput,
  type TargetType,
  togglePersonalTargetStep,
} from "@/features/target/target-repository";
import { cn } from "@/lib/utils";

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function defaultTarget(): PersonalTargetInput {
  return {
    title: "",
    type: "achievement",
    category: "Pribadi",
    target_value: 1,
    current_value: 0,
    unit: "",
    deadline: "",
    priority: "Normal",
    status: "Berjalan",
    notes: "",
  };
}

function toTargetInput(target: PersonalTarget): PersonalTargetInput {
  return {
    title: target.title,
    type: target.type,
    category: target.category,
    target_value: target.target_value,
    current_value: target.current_value,
    unit: target.unit ?? "",
    deadline: target.deadline ?? "",
    priority: target.priority,
    status: target.status,
    notes: target.notes ?? "",
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Tanpa deadline";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function progressValue(target: PersonalTarget) {
  if (target.target_value <= 0) return target.status === "Tercapai" ? 100 : 0;
  return Math.min(100, Math.round((target.current_value / target.target_value) * 100));
}

function valueLabel(target: PersonalTarget) {
  if (target.type === "item") return `${formatMoney(target.current_value)} / ${formatMoney(target.target_value)}`;
  const unit = target.unit?.trim() || "progres";
  return `${target.current_value} / ${target.target_value} ${unit}`;
}

function daysLeft(target: PersonalTarget) {
  if (!target.deadline) return null;
  const diff = Math.ceil((new Date(`${target.deadline}T00:00:00`).getTime() - new Date(`${localDate()}T00:00:00`).getTime()) / 86_400_000);
  if (diff < 0) return "Lewat deadline";
  if (diff === 0) return "Deadline hari ini";
  return `${diff} hari lagi`;
}

function typeLabel(target: PersonalTarget) {
  return target.type === "item" ? "Barang" : "Pencapaian";
}

function TargetTypeToggle({ value, onChange }: { value: TargetType; onChange: (value: TargetType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/20 p-1">
      <Button type="button" variant={value === "achievement" ? "default" : "ghost"} onClick={() => onChange("achievement")}>
        <Trophy data-icon="inline-start" />Pencapaian
      </Button>
      <Button type="button" variant={value === "item" ? "default" : "ghost"} onClick={() => onChange("item")}>
        <Gift data-icon="inline-start" />Barang
      </Button>
    </div>
  );
}

function TargetForm({ target, initialSteps, onSave, onCancel }: { target: PersonalTarget | null; initialSteps: PersonalTargetStep[]; onSave: (input: PersonalTargetInput, steps: PersonalTargetStepInput[]) => Promise<void>; onCancel: () => void }) {
  const [input, setInput] = useState<PersonalTargetInput>(() => target ? toTargetInput(target) : defaultTarget());
  const [steps, setSteps] = useState<PersonalTargetStepInput[]>([]);

  useEffect(() => {
    setInput(target ? toTargetInput(target) : defaultTarget());
    setSteps(target?.type === "achievement" ? initialSteps.map((step) => ({ id: step.id, title: step.title, completed: step.completed })) : [{ title: "" }]);
  }, [target, initialSteps]);

  const set = <K extends keyof PersonalTargetInput>(key: K, value: PersonalTargetInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.title.trim()) {
      toast.error("Judul target wajib diisi.");
      return;
    }
    const validSteps = steps.filter((step) => step.title.trim());
    if (input.type === "achievement" && !validSteps.length) {
      toast.error("Tambahkan minimal satu langkah checklist.");
      return;
    }
    await onSave(input, validSteps);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <TargetTypeToggle value={input.type} onChange={(value) => set("type", value)} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Judul target
          <Input autoFocus value={input.title} onChange={(event) => set("title", event.target.value)} placeholder={input.type === "item" ? "Contoh: Laptop kerja" : "Contoh: Lancar bahasa Inggris"} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Deadline
          <Input type="date" value={input.deadline ?? ""} onChange={(event) => set("deadline", event.target.value)} />
        </label>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Kategori</p>
        <div className="flex flex-wrap gap-2">
          {targetCategories.map((category) => (
            <Button key={category} type="button" variant={input.category === category ? "default" : "outline"} onClick={() => set("category", category)}>
              {category}
            </Button>
          ))}
        </div>
      </div>
      {input.type === "item" ? <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Target
          <Input type="number" min={1} value={input.target_value} onChange={(event) => set("target_value", Number(event.target.value))} placeholder="Harga target" />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Unit
          <Input value={input.unit ?? ""} onChange={(event) => set("unit", event.target.value)} placeholder="Otomatis rupiah" />
        </label>
      </div> : <div className="flex flex-col gap-2 rounded-xl border p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Langkah checklist</p><p className="text-xs text-muted-foreground">Beri nama tiap langkah, lalu centang dari Detail saat selesai.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setSteps((current) => [...current, { title: "" }])}><Plus data-icon="inline-start" />Tambah</Button></div><div className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">{steps.map((step, index) => <div className="flex items-center gap-2" key={step.id ?? `new-${index}`}><Input value={step.title} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} placeholder={`Contoh: Modul ${index + 1}`} /><Button type="button" size="icon" variant="ghost" aria-label={`Hapus langkah ${index + 1}`} disabled={steps.length === 1} onClick={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}</div></div>}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Prioritas
          <Select value={input.priority} onValueChange={(value) => set("priority", value as PersonalTargetInput["priority"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{targetPriorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Status
          <Select value={input.status} onValueChange={(value) => set("status", value as PersonalTargetInput["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{targetStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
          </Select>
        </label>
      </div>
      <label className="space-y-1.5 text-sm font-medium">
        Catatan
        <Textarea value={input.notes ?? ""} onChange={(event) => set("notes", event.target.value)} placeholder="Alasan, langkah kecil, atau detail target..." />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">{target ? "Simpan perubahan" : "Simpan target"}</Button>
      </DialogFooter>
    </form>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function TargetPage() {
  const [targets, setTargets] = useState<PersonalTarget[]>([]);
  const [stepsByTarget, setStepsByTarget] = useState<Record<number, PersonalTargetStep[]>>({});
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalTarget | null>(null);
  const [viewing, setViewing] = useState<PersonalTarget | null>(null);
  const [deleting, setDeleting] = useState<PersonalTarget | null>(null);

  const load = async () => {
    const [nextTargets, steps] = await Promise.all([listPersonalTargets(), listPersonalTargetSteps()]);
    setTargets(nextTargets);
    setStepsByTarget(steps.reduce<Record<number, PersonalTargetStep[]>>((grouped, step) => {
      (grouped[step.target_id] ??= []).push(step);
      return grouped;
    }, {}));
  };

  useEffect(() => {
    void load().catch(console.error);
  }, []);

  const visibleTargets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return targets.filter((target) => {
      const matchesQuery = !normalizedQuery || [target.title, target.category, target.notes ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesQuery && (typeFilter === "all" || target.type === typeFilter) && (statusFilter === "all" || target.status === statusFilter);
    });
  }, [targets, query, typeFilter, statusFilter]);

  const activeCount = targets.filter((target) => target.status === "Berjalan").length;
  const doneCount = targets.filter((target) => target.status === "Tercapai").length;
  const closeTargets = targets.filter((target) => progressValue(target) >= 70 && target.status !== "Tercapai").length;
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const saveTarget = async (input: PersonalTargetInput, steps: PersonalTargetStepInput[]) => {
    const targetId = await savePersonalTarget({ ...input, target_value: input.type === "achievement" ? steps.length : input.target_value, current_value: input.type === "achievement" ? 0 : input.current_value }, editing?.id);
    if (input.type === "achievement") await savePersonalTargetSteps(targetId, steps);
    setFormOpen(false);
    setEditing(null);
    await load();
    toast.success(editing ? "Target diperbarui." : "Target baru ditambahkan.");
  };

  const toggleStep = async (step: PersonalTargetStep, completed: boolean) => {
    await togglePersonalTargetStep(step, completed);
    await load();
    setViewing((current) => current ? { ...current, current_value: current.current_value + (completed ? 1 : -1) } : current);
  };

  const remove = async () => {
    if (!deleting) return;
    await deletePersonalTarget(deleting.id);
    setDeleting(null);
    setViewing(null);
    await load();
    toast.success("Target dihapus.");
  };

  const resetFilter = () => {
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <MobilePullToRefresh onRefresh={load}>
      <div className="flex flex-1 flex-col gap-4 overflow-x-hidden px-4 pt-12 pb-28 md:gap-5 md:px-8 md:py-5 md:pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-2xl">Target</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pantau barang yang ingin dicapai dan harapan pencapaian pribadi.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />Tambah Target
          </Button>
        </div>

        <Card className="py-3 shadow-sm">
          <CardContent className="grid gap-3 px-4 xl:grid-cols-[auto_1fr] xl:items-end">
            <div className="flex min-w-0 flex-wrap gap-2">
              <StatChip icon={Target} label="Total" value={targets.length} />
              <StatChip icon={WalletCards} label="Berjalan" value={activeCount} />
              <StatChip icon={Trophy} label="Hampir" value={closeTargets} />
              <StatChip icon={CheckCircle2} label="Selesai" value={doneCount} />
            </div>
            <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(240px,1fr)_140px_140px_auto] md:items-end xl:justify-self-end">
              <label className="space-y-1.5 text-sm font-medium">
                Cari
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, kategori, catatan..." />
                </div>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                Jenis
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="item">Barang</SelectItem>
                    <SelectItem value="achievement">Pencapaian</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                Status
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {targetStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <Button className="justify-start lg:mb-0" type="button" variant="ghost" onClick={resetFilter}>
                <RotateCcw data-icon="inline-start" />Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-2.5">
          {visibleTargets.map((target) => {
            const progress = progressValue(target);
            const Icon = target.type === "item" ? Gift : Trophy;
            const remaining = daysLeft(target);
            return (
              <Card key={target.id} className="gap-0 overflow-hidden rounded-2xl py-0 shadow-sm transition-colors hover:bg-muted/20">
                <CardContent className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(260px,1.15fr)_minmax(300px,1fr)_190px_120px_80px_40px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <button className="block max-w-full truncate text-left text-base font-semibold leading-tight hover:text-primary" type="button" onClick={() => setViewing(target)}>
                        {target.title}
                      </button>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{target.category}</Badge>
                        <Badge variant="outline">{target.priority}</Badge>
                        <Badge variant="outline">{typeLabel(target)}</Badge>
                      </div>
                      {target.notes && <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{target.notes}</p>}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="truncate font-semibold">{valueLabel(target)}</p>
                      </div>
                      <p className="text-xl font-semibold">{progress}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="min-w-0 text-sm">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="truncate font-semibold">{formatDate(target.deadline)}</p>
                    <p className={cn("truncate text-xs text-muted-foreground", remaining === "Lewat deadline" && "text-destructive")}>{remaining ?? "Belum ditentukan"}</p>
                  </div>

                  <div className="flex items-center gap-2 lg:justify-center">
                    <Badge className="min-w-24" variant={target.status === "Tercapai" ? "default" : target.status === "Ditunda" ? "secondary" : "outline"}>
                      {target.status}
                    </Badge>
                    <Button className="lg:hidden" size="sm" variant="ghost" onClick={() => setViewing(target)}>
                      Detail
                    </Button>
                  </div>

                  <Button className="hidden lg:inline-flex" size="sm" variant="ghost" onClick={() => setViewing(target)}>
                    Detail
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={`Aksi ${target.title}`}><Ellipsis className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(target); setFormOpen(true); }}><Pencil data-icon="inline-start" />Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(target)}><Trash2 data-icon="inline-start" />Hapus</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!visibleTargets.length && (
          <Card>
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
              <Target className="size-10 text-muted-foreground" />
              <div>
                <p className="font-semibold">Belum ada target.</p>
                <p className="text-sm text-muted-foreground">Tambah target barang atau pencapaian pribadi untuk mulai memantau progress.</p>
              </div>
              <Button onClick={openCreate}><Plus data-icon="inline-start" />Tambah Target</Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] !overflow-y-auto md:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Target" : "Tambah Target"}</DialogTitle>
              <DialogDescription>{editing ? "Perbarui detail dan progress target." : "Buat target barang atau pencapaian yang ingin kamu kejar."}</DialogDescription>
            </DialogHeader>
            <TargetForm target={editing} initialSteps={editing ? stepsByTarget[editing.id] ?? [] : []} onCancel={() => setFormOpen(false)} onSave={saveTarget} />
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
          <DialogContent className="md:max-w-2xl">
            {viewing && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {viewing.type === "item" ? <Gift className="size-5 text-primary" /> : <Trophy className="size-5 text-primary" />}
                    {viewing.title}
                  </DialogTitle>
                  <DialogDescription>{viewing.category} · {viewing.status} · {viewing.priority}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Progress target</p>
                        <p className="text-xl font-semibold">{valueLabel(viewing)}</p>
                      </div>
                      <p className="text-3xl font-semibold">{progressValue(viewing)}%</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progressValue(viewing)}%` }} />
                    </div>
                  </div>
                  {viewing.type === "achievement" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium">Checklist pencapaian</p>
                      {(stepsByTarget[viewing.id] ?? []).map((step) => (
                        <label key={step.id} className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40">
                          <Checkbox checked={Boolean(step.completed)} onCheckedChange={(checked) => void toggleStep(step, checked === true)} />
                          <span className={cn("flex-1", step.completed && "text-muted-foreground line-through")}>{step.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border p-3">
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-semibold">{formatDate(viewing.deadline)}</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-sm text-muted-foreground">Sisa waktu</p>
                      <p className={cn("font-semibold", daysLeft(viewing) === "Lewat deadline" && "text-destructive")}>{daysLeft(viewing) ?? "Belum ditentukan"}</p>
                    </div>
                  </div>
                  {viewing.notes && <p className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">{viewing.notes}</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewing(null)}>Tutup</Button>
                  <Button onClick={() => { setEditing(viewing); setViewing(null); setFormOpen(true); }}><Pencil data-icon="inline-start" />Edit</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus target?</AlertDialogTitle>
              <AlertDialogDescription>Target “{deleting?.title}” akan dipindahkan dari daftar aktif.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobilePullToRefresh>
  );
}

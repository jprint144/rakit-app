import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Ellipsis, Flame, ListChecks, Pencil, Plus, RotateCcw, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  deleteHabitTracker,
  habitCategories,
  listHabitEntries,
  listHabitTrackers,
  saveHabitNumberEntry,
  saveHabitTracker,
  toggleHabitChecklistEntry,
  type HabitEntry,
  type HabitTracker,
  type HabitTrackerInput,
  type HabitTrackerType,
} from "@/features/habit-tracker/habit-tracker-repository";
import { MobilePullToRefresh } from "@/components/mobile-pull-to-refresh";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EntryDraft = { tracker: HabitTracker; date: string; value: string; note: string };

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const shortDayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short" });
const calendarWeekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addOneMonth(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return localDate();
  const next = new Date(year, month, day);
  return formatLocalDate(next);
}

function currentMonth() {
  return localDate().slice(0, 7);
}

function shiftMonth(month: string, direction: -1 | 1) {
  const [year, monthIndex] = month.split("-").map(Number);
  const next = new Date(year, monthIndex - 1 + direction, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const totalDays = new Date(year, monthIndex, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    return { day, date, label: shortDayFormatter.format(new Date(`${date}T00:00:00`)) };
  });
  return { days, start: days[0]?.date ?? `${month}-01`, end: days.at(-1)?.date ?? `${month}-31` };
}

function rangeDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const days: { day: number; date: string; label: string }[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = formatLocalDate(cursor);
    days.push({ day: Number(date.slice(8, 10)), date, label: shortDayFormatter.format(new Date(`${date}T00:00:00`)) });
  }
  return days;
}

function periodDays(tracker: HabitTracker) {
  return rangeDays(tracker.start_date, tracker.end_date || addOneMonth(tracker.start_date));
}

function calendarCells(days: { day: number; date: string; label: string }[]) {
  const firstDate = days[0]?.date;
  if (!firstDate) return [];
  const firstDay = new Date(`${firstDate}T00:00:00`).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const cells: ({ day: number; date: string; label: string } | null)[] = [
    ...Array.from({ length: mondayOffset }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function defaultTracker(): HabitTrackerInput {
  const startDate = localDate();
  return {
    name: "",
    notes: "",
    category: "Pribadi",
    color: "#60a5fa",
    tracking_type: "checklist",
    target_monthly: 0,
    start_date: startDate,
    end_date: addOneMonth(startDate),
  };
}

function toTrackerInput(tracker: HabitTracker): HabitTrackerInput {
  return {
    name: tracker.name,
    notes: tracker.notes ?? "",
    category: tracker.category,
    color: tracker.color,
    tracking_type: tracker.tracking_type,
    target_monthly: tracker.target_monthly,
    start_date: tracker.start_date,
    end_date: tracker.end_date,
  };
}

function entryKey(trackerId: number, date: string) {
  return `${trackerId}:${date}`;
}

function isEntryDone(entry?: HabitEntry) {
  return Boolean(entry && (entry.completed === 1 || (entry.value_number ?? 0) > 0));
}

function isMissedDate(date: string, done: boolean) {
  return date < localDate() && !done;
}

function activeDays(tracker: HabitTracker, days: { date: string }[]) {
  return days.filter((day) => day.date >= tracker.start_date && day.date <= tracker.end_date);
}

function completedCount(tracker: HabitTracker, entriesByKey: Map<string, HabitEntry>, days: { date: string }[]) {
  return activeDays(tracker, days).filter((day) => isEntryDone(entriesByKey.get(entryKey(tracker.id, day.date)))).length;
}

function bestStreak(trackers: HabitTracker[], entriesByKey: Map<string, HabitEntry>) {
  let best = 0;
  for (const tracker of trackers) {
    let current = 0;
    for (const day of activeDays(tracker, periodDays(tracker))) {
      if (isEntryDone(entriesByKey.get(entryKey(tracker.id, day.date)))) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
  }
  return best;
}

export default function HabitTrackerPage() {
  const [trackers, setTrackers] = useState<HabitTracker[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HabitTracker | null>(null);
  const [deleting, setDeleting] = useState<HabitTracker | null>(null);
  const [entryDraft, setEntryDraft] = useState<EntryDraft | null>(null);

  const { start, end } = useMemo(() => monthRange(month), [month]);
  const entriesByKey = useMemo(() => new Map(entries.map((entry) => [entryKey(entry.tracker_id, entry.entry_date), entry])), [entries]);
  const categories = useMemo(() => [...new Set([...habitCategories, ...trackers.map((tracker) => tracker.category)])].filter(Boolean), [trackers]);
  const visibleTrackers = trackers.filter((tracker) => categoryFilter === "all" || tracker.category === categoryFilter);
  const totalDone = visibleTrackers.reduce((total, tracker) => total + completedCount(tracker, entriesByKey, periodDays(tracker)), 0);
  const totalSlots = visibleTrackers.reduce((total, tracker) => total + activeDays(tracker, periodDays(tracker)).length, 0);
  const consistency = totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0;
  const streak = bestStreak(visibleTrackers, entriesByKey);

  const load = async () => {
    const nextTrackers = await listHabitTrackers();
    const rangeStart = [start, ...nextTrackers.map((tracker) => tracker.start_date)].sort()[0] ?? start;
    const rangeEnd = [end, ...nextTrackers.map((tracker) => tracker.end_date)].sort().at(-1) ?? end;
    const nextEntries = await listHabitEntries(rangeStart, rangeEnd);
    setTrackers(nextTrackers);
    setEntries(nextEntries);
  };

  useEffect(() => {
    void load().catch(console.error);
  }, [start, end]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (tracker: HabitTracker) => {
    setEditing(tracker);
    setFormOpen(true);
  };

  const saveTracker = async (input: HabitTrackerInput) => {
    await saveHabitTracker(input, editing?.id);
    setFormOpen(false);
    setEditing(null);
    await load();
    toast.success(editing ? "Tracker diperbarui." : "Tracker baru ditambahkan.");
  };

  const toggleDay = async (tracker: HabitTracker, date: string) => {
    const entry = entriesByKey.get(entryKey(tracker.id, date));
    if (tracker.tracking_type === "number") {
      setEntryDraft({ tracker, date, value: entry?.value_number?.toString() ?? "", note: entry?.note ?? "" });
      return;
    }
    await toggleHabitChecklistEntry(tracker.id, date, !isEntryDone(entry));
    await load();
  };

  const saveNumber = async () => {
    if (!entryDraft) return;
    const value = entryDraft.value.trim() ? Number(entryDraft.value) : null;
    if (value !== null && !Number.isFinite(value)) return;
    await saveHabitNumberEntry(entryDraft.tracker.id, entryDraft.date, value, entryDraft.note);
    setEntryDraft(null);
    await load();
  };

  const remove = async () => {
    if (!deleting) return;
    await deleteHabitTracker(deleting.id);
    setDeleting(null);
    await load();
    toast.success("Tracker dihapus.");
  };

  const resetFilter = () => {
    setCategoryFilter("all");
    setMonth(currentMonth());
  };
  const previousMonth = () => setMonth((value) => shiftMonth(value, -1));
  const nextMonth = () => setMonth((value) => shiftMonth(value, 1));

  return (
    <MobilePullToRefresh onRefresh={load}>
      <div className="flex flex-1 flex-col gap-4 overflow-x-hidden px-4 pt-12 pb-28 md:gap-5 md:px-8 md:py-5 md:pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-2xl">Habit Tracker</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tracking custom per bulan untuk kebiasaan, target, angka, atau rutinitas pribadi.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />Tambah Tracker
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CompactSummary icon={ListChecks} label="Aktif" value={visibleTrackers.length.toString()} />
              <CompactSummary icon={Check} label="Selesai" value={totalDone.toString()} />
              <CompactSummary icon={Flame} label="Streak" value={`${streak}h`} />
              <CompactSummary icon={Target} label="Konsistensi" value={`${consistency}%`} />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
              <Button type="button" size="icon" variant="outline" aria-label="Bulan sebelumnya" onClick={previousMonth}><ChevronLeft /></Button>
              <Input className="w-44" type="month" value={month} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(event) => setMonth(event.target.value || currentMonth())} />
              <Button type="button" size="icon" variant="outline" aria-label="Bulan berikutnya" onClick={nextMonth}><ChevronRight /></Button>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Semua kategori</SelectItem>
                    {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button className="shrink-0" type="button" variant="ghost" size="sm" onClick={resetFilter}><RotateCcw data-icon="inline-start" />Reset</Button>
            </div>
          </CardContent>
        </Card>

        {visibleTrackers.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex min-h-52 flex-col items-center justify-center gap-2 text-center">
              <CalendarDays className="size-9 text-muted-foreground" />
              <p className="font-medium">Belum ada tracker pada bulan ini.</p>
              <p className="text-sm text-muted-foreground">Tambahkan tracker custom untuk mulai mencatat progress bulanan.</p>
              <Button className="mt-2" onClick={openCreate}><Plus data-icon="inline-start" />Tambah Tracker</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Tracking {monthFormatter.format(new Date(`${month}-01T00:00:00`))}</CardTitle>
                <CardDescription>Klik tanggal untuk mencentang checklist atau mengisi angka. Periode mengikuti tanggal mulai sampai tanggal akhir tiap tracker.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {visibleTrackers.map((tracker) => <TrackerMonthCard key={tracker.id} tracker={tracker} days={periodDays(tracker)} entriesByKey={entriesByKey} onDayClick={toggleDay} onEdit={openEdit} onDelete={setDeleting} />)}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Tracker" : "Tambah Tracker"}</DialogTitle>
              <DialogDescription>Buat tracker bulanan untuk apa saja yang ingin kamu pantau.</DialogDescription>
            </DialogHeader>
            <HabitTrackerForm tracker={editing ? toTrackerInput(editing) : defaultTracker()} onCancel={() => setFormOpen(false)} onSubmit={saveTracker} />
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(entryDraft)} onOpenChange={(open) => !open && setEntryDraft(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Isi angka harian</DialogTitle>
              <DialogDescription>{entryDraft?.tracker.name} · {entryDraft?.date}</DialogDescription>
            </DialogHeader>
            {entryDraft && <div className="flex flex-col gap-3">
              <label className="grid gap-1.5 text-sm font-medium">Nilai
                <Input autoFocus inputMode="decimal" value={entryDraft.value} onChange={(event) => setEntryDraft({ ...entryDraft, value: event.target.value })} placeholder="Contoh: 2" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Catatan
                <Textarea rows={2} value={entryDraft.note} onChange={(event) => setEntryDraft({ ...entryDraft, note: event.target.value })} placeholder="Opsional" />
              </label>
            </div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEntryDraft(null)}>Batal</Button>
              <Button onClick={() => void saveNumber()}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus tracker?</AlertDialogTitle>
              <AlertDialogDescription>Tracker “{deleting?.name}” akan dihapus dari daftar Habit Tracker.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => void remove()}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobilePullToRefresh>
  );
}

function CompactSummary({ icon: Icon, label, value }: { icon: typeof ListChecks; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5">
      <Icon className="text-muted-foreground" />
      <div className="flex min-w-0 items-baseline gap-1.5">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function InfoPill({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "primary" | "destructive" | "muted" }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "text-base font-semibold",
        tone === "primary" && "text-primary",
        tone === "destructive" && "text-destructive",
        tone === "muted" && "text-muted-foreground",
      )}>{value}</p>
    </div>
  );
}

function PeriodPill({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <div className="grid min-h-16 overflow-hidden rounded-xl border bg-muted/30">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">Mulai</p>
        <p className="truncate text-base font-semibold">{startDate}</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
        <p className="text-xs text-muted-foreground">Akhir</p>
        <p className="truncate text-base font-semibold">{endDate}</p>
      </div>
    </div>
  );
}

function TrackerMonthCard({ tracker, days, entriesByKey, onDayClick, onEdit, onDelete }: {
  tracker: HabitTracker;
  days: { day: number; date: string; label: string }[];
  entriesByKey: Map<string, HabitEntry>;
  onDayClick: (tracker: HabitTracker, date: string) => Promise<void>;
  onEdit: (tracker: HabitTracker) => void;
  onDelete: (tracker: HabitTracker) => void;
}) {
  const done = completedCount(tracker, entriesByKey, days);
  const trackerDays = activeDays(tracker, days);
  const target = tracker.target_monthly || trackerDays.length;
  const missed = trackerDays.filter((day) => isMissedDate(day.date, isEntryDone(entriesByKey.get(entryKey(tracker.id, day.date))))).length;
  const progress = Math.min(100, Math.round((done / Math.max(1, target)) * 100));
  return (
    <div className="grid gap-4 rounded-2xl border bg-background p-3 md:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] md:p-4">
      <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: tracker.color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold leading-tight">{tracker.name}</p>
          <p className="text-xs text-muted-foreground">{tracker.category} · {tracker.tracking_type === "number" ? "Angka" : "Checklist"} · {done}/{target} target</p>
        </div>
        <TrackerActions tracker={tracker} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <div className="grid flex-1 auto-rows-fr gap-2">
        <PeriodPill startDate={tracker.start_date} endDate={tracker.end_date} />
        <InfoPill label="Selesai" value={done.toString()} tone="primary" />
        <InfoPill label="Target" value={target.toString()} />
        <InfoPill label="Terlewat" value={missed.toString()} tone={missed > 0 ? "destructive" : "muted"} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{progress}% dari target bulan ini{tracker.notes ? ` · ${tracker.notes}` : ""}</p>
      </div>
      </div>
      <div className="grid grid-cols-7 items-start justify-items-center gap-1.5 rounded-xl bg-muted/30 p-2 md:gap-2 md:p-3">
        {calendarWeekdays.map((weekday) => <div key={weekday} className="grid size-9 place-items-center text-center text-[11px] font-medium text-muted-foreground md:size-10">{weekday}</div>)}
        {calendarCells(days).map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="size-9 md:size-10" />;
          const entry = entriesByKey.get(entryKey(tracker.id, day.date));
          const doneEntry = isEntryDone(entry);
          const disabled = day.date < tracker.start_date || day.date > tracker.end_date;
          return <DayButton key={day.date} tracker={tracker} date={day.date} day={day.day} entry={entry} done={doneEntry} missed={!disabled && isMissedDate(day.date, doneEntry)} disabled={disabled} onClick={() => onDayClick(tracker, day.date)} />;
        })}
      </div>
    </div>
  );
}

function DayButton({ tracker, date, day, entry, done, missed, disabled, onClick }: { tracker: HabitTracker; date: string; day: number; entry?: HabitEntry; done: boolean; missed: boolean; disabled: boolean; onClick: () => Promise<void> }) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors md:size-10",
        disabled && "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/40",
        done && "border-primary bg-primary text-primary-foreground",
        missed && !done && !disabled && "border-destructive/40 bg-destructive/10 text-destructive",
        !done && !missed && !disabled && "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
      title={tracker.tracking_type === "number" && entry?.value_number ? `${date}: ${entry.value_number}` : date}
      disabled={disabled}
      onClick={() => void onClick()}
    >
      {disabled ? day : tracker.tracking_type === "number" && entry?.value_number ? entry.value_number : done ? <Check /> : missed ? <X /> : day}
    </button>
  );
}

function TrackerActions({ tracker, onEdit, onDelete }: { tracker: HabitTracker; onEdit: (tracker: HabitTracker) => void; onDelete: (tracker: HabitTracker) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={`Aksi ${tracker.name}`}><Ellipsis /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onEdit(tracker)}><Pencil />Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(tracker)}><Trash2 />Hapus</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HabitTrackerForm({ tracker, onSubmit, onCancel }: { tracker: HabitTrackerInput; onSubmit: (input: HabitTrackerInput) => Promise<void>; onCancel: () => void }) {
  const [input, setInput] = useState(tracker);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.name.trim()) return;
    setSaving(true);
    try { await onSubmit(input); } finally { setSaving(false); }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid gap-1.5 text-sm font-medium">Nama tracker
          <Input autoFocus required value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} placeholder="Contoh: Olahraga, Baca buku, No spend" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">Warna
          <Input className="size-10 cursor-pointer p-1" type="color" value={input.color} onChange={(event) => setInput({ ...input, color: event.target.value })} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">Catatan
        <Textarea rows={2} value={input.notes ?? ""} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Opsional" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">Mulai tracking
          <Input
            className="scheme-light dark:scheme-dark"
            type="date"
            value={input.start_date}
            onClick={(event) => event.currentTarget.showPicker?.()}
            onChange={(event) => {
              const startDate = event.target.value || localDate();
              setInput({ ...input, start_date: startDate, end_date: addOneMonth(startDate) });
            }}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">Akhir tracking
          <Input
            className="scheme-light dark:scheme-dark"
            type="date"
            min={input.start_date}
            value={input.end_date}
            onClick={(event) => event.currentTarget.showPicker?.()}
            onChange={(event) => setInput({ ...input, end_date: event.target.value || addOneMonth(input.start_date) })}
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 text-sm font-medium sm:col-span-2">Kategori
          <div className="flex flex-wrap gap-2">
            {habitCategories.map((category) => <Button key={category} type="button" size="sm" variant={input.category === category ? "default" : "outline"} onClick={() => setInput({ ...input, category })}>{category}</Button>)}
          </div>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">Tipe
          <Select value={input.tracking_type} onValueChange={(value) => setInput({ ...input, tracking_type: value as HabitTrackerType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup><SelectItem value="checklist">Checklist</SelectItem><SelectItem value="number">Angka</SelectItem></SelectGroup></SelectContent>
          </Select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">Target/bulan
          <Input type="number" min={0} value={input.target_monthly} onChange={(event) => setInput({ ...input, target_monthly: Number(event.target.value) || 0 })} placeholder="0" />
        </label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan Tracker"}</Button>
      </DialogFooter>
    </form>
  );
}

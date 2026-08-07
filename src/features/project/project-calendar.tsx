import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Project } from "@/features/project/project-repository";
import {
  isProjectOverdue,
  paymentStatusLabels,
  projectWhatsAppUrl,
} from "@/features/project/project-status";

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function key(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function CalendarViewSelector({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(nextValue) => nextValue && onValueChange(nextValue)}
    >
      <ToggleGroupItem value="week">Minggu</ToggleGroupItem>
      <ToggleGroupItem value="month">Bulan</ToggleGroupItem>
      <ToggleGroupItem value="year">Tahun</ToggleGroupItem>
    </ToggleGroup>
  );
}

export function ProjectCalendar({
  projects,
  onProjectClick,
}: {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}) {
  const [selected, setSelected] = useState<Date | undefined>();
  const [view, setView] = useState("month");
  const due = projects.filter((project) => project.deadline);
  const selectedProjects = selected
    ? due.filter((project) => project.deadline === key(selected))
    : [];
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    const daysSinceMonday = (today.getDay() + 6) % 7;
    date.setDate(today.getDate() - daysSinceMonday + index);
    return date;
  });
  const monthSummary = Array.from({ length: 12 }, (_, month) => ({
    month,
    projects: due.filter(
      (project) => toDate(project.deadline!).getMonth() === month,
    ),
  }));

  if (view === "week") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm">
          <div>
            <h2 className="font-semibold">Deadline Mingguan</h2>
            <p className="text-sm text-muted-foreground">
              Project berdasarkan tanggal deadline minggu ini.
            </p>
          </div>
          <CalendarViewSelector value={view} onValueChange={setView} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {week.map((date) => {
            const items = due.filter((project) => project.deadline === key(date));
            return (
              <section
                key={key(date)}
                className="flex min-h-40 flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm"
              >
                <p className="text-sm font-semibold">
                  {date.toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada deadline</p>
                ) : (
                  items.map((project) => (
                    <Button
                      key={project.id}
                      variant="outline"
                      className="h-auto justify-start whitespace-normal text-left"
                      onClick={() => onProjectClick(project)}
                    >
                      {project.name}
                    </Button>
                  ))
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "year") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm">
          <div>
            <h2 className="font-semibold">Deadline Tahunan</h2>
            <p className="text-sm text-muted-foreground">
              Ringkasan deadline project per bulan.
            </p>
          </div>
          <CalendarViewSelector value={view} onValueChange={setView} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {monthSummary.map(({ month, projects: items }) => (
            <section
              key={month}
              className="flex min-h-36 flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">
                  {new Date(today.getFullYear(), month).toLocaleDateString(
                    "id-ID",
                    { month: "long" },
                  )}
                </h2>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada deadline</p>
              ) : (
                items.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className="h-auto justify-start px-0 text-left"
                    onClick={() => onProjectClick(project)}
                  >
                    {project.name}
                  </Button>
                ))
              )}
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <section className="rounded-2xl border bg-card p-4 shadow-sm xl:col-span-8">
        <Calendar
          numberOfMonths={2}
          className="w-full"
          classNames={{ root: "w-full", month_grid: "w-full" }}
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{
            deadline: due.map((project) => toDate(project.deadline!)),
          }}
          modifiersClassNames={{ deadline: "bg-primary/15 font-semibold" }}
        />
      </section>
      <aside className="flex min-h-72 flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm xl:col-span-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div className="min-w-0">
            <h2 className="font-semibold">
              {selected
                ? `Deadline ${selected.toLocaleDateString("id-ID")}`
                : "Pilih tanggal deadline"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected
                ? `${selectedProjects.length} project pada tanggal ini.`
                : "Pilih tanggal pada kalender untuk melihat project."}
            </p>
          </div>
          <CalendarViewSelector value={view} onValueChange={setView} />
        </div>
        {selectedProjects.map((project) => {
          const whatsappUrl = projectWhatsAppUrl(project.client_whatsapp);
          return (
            <div key={project.id} className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{project.name}</span>
                <Badge variant="secondary">{project.client_name}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {paymentStatusLabels[project.payment_status] ??
                    project.payment_status}
                </Badge>
                {isProjectOverdue(project) && (
                  <Badge variant="destructive">Deadline lewat</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProjectClick(project)}
                >
                  Detail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!whatsappUrl}
                  onClick={() =>
                    whatsappUrl && openUrl(whatsappUrl).catch(console.error)
                  }
                >
                  <MessageCircle data-icon="inline-start" />
                  WhatsApp
                </Button>
              </div>
            </div>
          );
        })}
      </aside>
    </div>
  );
}
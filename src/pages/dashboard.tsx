import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, FolderKanban, TriangleAlert, UsersRound, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobilePullToRefresh } from "@/components/mobile-pull-to-refresh";
import { listProjectFinancialSummaries } from "@/features/finance/finance-repository";
import type { ProjectFinancialSummary } from "@/features/finance/finance-repository";
import { listArchivedProjects, listProjects } from "@/features/project/project-repository";
import type { Project } from "@/features/project/project-repository";
import { isProjectOverdue, projectStatusLabels } from "@/features/project/project-status";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [financials, setFinancials] = useState<ProjectFinancialSummary[]>([]);

  const refresh = () => Promise.all([listProjects(), listArchivedProjects(), listProjectFinancialSummaries()])
    .then(([nextProjects, nextArchivedProjects, nextFinancials]) => { setProjects(nextProjects); setArchivedProjects(nextArchivedProjects); setFinancials(nextFinancials); })
    .catch(console.error);
  useEffect(() => { void refresh(); }, []);

  const totals = useMemo(() => financials.reduce((all, item) => ({ income: all.income + item.income_amount, expense: all.expense + item.expense_amount }), { income: 0, expense: 0 }), [financials]);
  const overdue = projects.filter(isProjectOverdue);
  const activeClients = new Set(projects.map((project) => project.client_name.trim()).filter(Boolean));
  const statuses = [
    ...Object.entries(projectStatusLabels).map(([status, label]) => ({ label, count: projects.filter((project) => project.kanban_status === status).length })),
    { label: "Arsip", count: archivedProjects.length },
  ];
  const summaryCards = [
    { label: "Project Aktif", value: projects.length, icon: FolderKanban },
    { label: "Klien Aktif", value: activeClients.size, icon: UsersRound },
    { label: "Project Selesai", value: [...projects, ...archivedProjects].filter((project) => project.kanban_status === "done").length, icon: WalletCards },
    { label: "Deadline Lewat", value: overdue.length, icon: TriangleAlert },
  ];

  return (
    <MobilePullToRefresh onRefresh={refresh}><main className="flex flex-1 flex-col gap-3 px-4 py-4 pb-20 md:gap-5 md:px-8 md:py-6 md:pb-6">
      <section>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-base">Ringkasan project dan keuangan Anda saat ini.</p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-5" aria-label="Ringkasan">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return <Card className="gap-2 py-3" key={card.label}><CardHeader className="px-3"><CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="size-3.5" />{card.label}</CardTitle></CardHeader><CardContent className="px-3"><p className="text-xl font-semibold md:text-3xl">{card.value}</p></CardContent></Card>;
        })}
        <Card className="col-span-2 gap-2 py-3 xl:col-span-1"><CardHeader className="px-3"><CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CircleDollarSign className="size-3.5" />Margin Riil</CardTitle></CardHeader><CardContent className="px-3"><p className="text-xl font-semibold">{currency.format(totals.income - totals.expense)}</p></CardContent></Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-3"><CardTitle className="text-base">Status Project</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 px-3">
            {statuses.map((status) => <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5" key={status.label}><span className="truncate text-xs text-muted-foreground">{status.label}</span><Badge className="shrink-0 text-xs" variant="secondary">{status.count}</Badge></div>)}
          </CardContent>
        </Card>
        <Card className="gap-3 py-4"><CardHeader className="px-3"><CardTitle className="text-base">Keuangan</CardTitle></CardHeader><CardContent className="grid gap-2 px-3"><div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2.5 py-2"><span className="text-xs text-muted-foreground">Omset</span><span className="text-right text-sm font-medium">{currency.format(totals.income)}</span></div><div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2.5 py-2"><span className="text-xs text-muted-foreground">Pengeluaran</span><span className="text-right text-sm font-medium">{currency.format(totals.expense)}</span></div><div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2"><span className="text-xs font-medium">Margin</span><span className="text-right text-sm font-semibold">{currency.format(totals.income - totals.expense)}</span></div></CardContent></Card>
      </section>

      <Card className="gap-3 py-4"><CardHeader className="px-3"><CardTitle className="text-base">Project dengan deadline lewat</CardTitle></CardHeader><CardContent className="grid gap-2 px-3">{overdue.length ? overdue.map((project) => <div className="flex items-center justify-between gap-3 rounded-md border px-2.5 py-2" key={project.id}><div className="min-w-0"><p className="truncate text-sm font-medium">{project.name}</p><p className="truncate text-xs text-muted-foreground">{project.client_name}</p></div><Badge className="shrink-0 text-xs" variant="outline">{project.deadline}</Badge></div>) : <p className="text-xs text-muted-foreground">Tidak ada project yang melewati deadline.</p>}</CardContent></Card>
    </main></MobilePullToRefresh>
  );
}

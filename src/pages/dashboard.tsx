import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, FolderKanban, TriangleAlert, UsersRound, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProjectFinancialSummaries } from "@/features/finance/finance-repository";
import type { ProjectFinancialSummary } from "@/features/finance/finance-repository";
import { listProjects } from "@/features/project/project-repository";
import type { Project } from "@/features/project/project-repository";
import { isProjectOverdue, projectStatusLabels } from "@/features/project/project-status";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [financials, setFinancials] = useState<ProjectFinancialSummary[]>([]);

  useEffect(() => {
    void Promise.all([listProjects(), listProjectFinancialSummaries()]).then(([nextProjects, nextFinancials]) => {
      setProjects(nextProjects);
      setFinancials(nextFinancials);
    }).catch(console.error);
  }, []);

  const totals = useMemo(() => financials.reduce((all, item) => ({ income: all.income + item.income_amount, expense: all.expense + item.expense_amount }), { income: 0, expense: 0 }), [financials]);
  const overdue = projects.filter(isProjectOverdue);
  const activeClients = new Set(projects.map((project) => project.client_name.trim()).filter(Boolean));
  const statuses = Object.entries(projectStatusLabels).map(([status, label]) => ({ label, count: projects.filter((project) => project.kanban_status === status).length }));

  return <div className="flex flex-1 flex-col gap-6 px-6 py-5 md:px-8"><div><h1 className="text-2xl font-semibold">Dashboard</h1><p className="text-muted-foreground">Ringkasan project dan keuangan Anda saat ini.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><FolderKanban />Project Aktif</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{projects.length}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><UsersRound />Klien Aktif</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{activeClients.size}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><WalletCards />Project Selesai</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{projects.filter((project) => project.kanban_status === "done").length}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><TriangleAlert />Deadline Lewat</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{overdue.length}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><CircleDollarSign />Margin Riil</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{currency.format(totals.income - totals.expense)}</p></CardContent></Card></div><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Status Project</CardTitle></CardHeader><CardContent className="grid gap-3">{statuses.map((status) => <div className="flex items-center justify-between" key={status.label}><span className="text-sm text-muted-foreground">{status.label}</span><Badge variant="secondary">{status.count}</Badge></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Keuangan</CardTitle></CardHeader><CardContent className="grid gap-3"><div className="flex justify-between"><span className="text-sm text-muted-foreground">Omset</span><span className="font-medium">{currency.format(totals.income)}</span></div><div className="flex justify-between"><span className="text-sm text-muted-foreground">Pengeluaran</span><span className="font-medium">{currency.format(totals.expense)}</span></div><div className="flex justify-between border-t pt-3"><span className="text-sm font-medium">Margin</span><span className="font-semibold">{currency.format(totals.income - totals.expense)}</span></div></CardContent></Card></div><Card><CardHeader><CardTitle>Project dengan deadline lewat</CardTitle></CardHeader><CardContent className="grid gap-2">{overdue.length ? overdue.map((project) => <div className="flex items-center justify-between rounded-md border p-3" key={project.id}><div><p className="font-medium">{project.name}</p><p className="text-sm text-muted-foreground">{project.client_name}</p></div><Badge variant="outline">{project.deadline}</Badge></div>) : <p className="text-sm text-muted-foreground">Tidak ada project yang melewati deadline.</p>}</CardContent></Card></div>;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ReceiptText, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseDialog } from "@/features/finance/expense-dialog";
import { listExpenseTransactions, listIncomeTransactions, listProjectFinancialSummaries, syncExistingOrderIncomes } from "@/features/finance/finance-repository";
import type { IncomeTransaction, ProjectFinancialSummary } from "@/features/finance/finance-repository";

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function History({ title, rows, income }: { title: string; rows: IncomeTransaction[]; income: boolean }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2">{income ? <WalletCards /> : <ReceiptText />}{title}</CardTitle><CardDescription>{income ? "Omset yang diambil dari pesanan project." : "Biaya riil yang dicatat setelah urusan klien selesai."}</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Project</TableHead><TableHead>{income ? "Pesanan" : "Catatan"}</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.transaction_date}</TableCell><TableCell><div className="flex flex-col"><span>{row.project_name}</span><span className="text-xs text-muted-foreground">{row.project_code}</span></div></TableCell><TableCell>{income ? <Badge variant="secondary">{row.installment_name || "Pemasukan"}</Badge> : row.notes || "-"}</TableCell><TableCell className="text-right font-medium">{rupiah(row.amount)}</TableCell></TableRow>)}{rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Belum ada transaksi tercatat.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>;
}

function ProjectResults({ rows }: { rows: ProjectFinancialSummary[] }) {
  return <Card><CardHeader><CardTitle>Hasil Riil per Project</CardTitle><CardDescription>Omset dari pesanan dikurangi semua pengeluaran yang Anda catat.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Project</TableHead><TableHead className="text-center">Pesanan</TableHead><TableHead className="text-right">Omset</TableHead><TableHead className="text-right">Pengeluaran</TableHead><TableHead className="text-right">Margin Riil</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.project_id}><TableCell><div className="flex flex-col"><span className="font-medium">{row.project_name}</span><span className="text-xs text-muted-foreground">{row.project_code}</span></div></TableCell><TableCell className="text-center">{row.order_count}</TableCell><TableCell className="text-right">{rupiah(row.income_amount)}</TableCell><TableCell className="text-right">{rupiah(row.expense_amount)}</TableCell><TableCell className="text-right font-semibold">{rupiah(row.income_amount - row.expense_amount)}</TableCell></TableRow>)}{rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada project yang memiliki pesanan.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>;
}

export default function FinancePage() {
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<IncomeTransaction[]>([]);
  const [summaries, setSummaries] = useState<ProjectFinancialSummary[]>([]);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const refresh = useCallback(async () => {
    await syncExistingOrderIncomes();
    const [incomeRows, expenseRows, summaryRows] = await Promise.all([listIncomeTransactions(), listExpenseTransactions(), listProjectFinancialSummaries()]);
    setIncomes(incomeRows); setExpenses(expenseRows); setSummaries(summaryRows);
  }, []);
  useEffect(() => { void refresh().catch(console.error); }, [refresh]);
  const income = useMemo(() => summaries.reduce((sum, row) => sum + row.income_amount, 0), [summaries]);
  const expense = useMemo(() => summaries.reduce((sum, row) => sum + row.expense_amount, 0), [summaries]);
  const eligibleCount = summaries.filter((project) => project.has_invoice && project.has_nota).length;
  return <main className="flex flex-1 flex-col gap-4 p-4 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Keuangan</h1><p className="text-muted-foreground">Pantau omset pesanan, pengeluaran, dan margin riil setiap project.</p></div><Button onClick={() => setExpenseOpen(true)} disabled={!eligibleCount}><Plus data-icon="inline-start" />Input Pengeluaran</Button></div><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardDescription>Omset</CardDescription><CardTitle className="text-2xl">{rupiah(income)}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Pengeluaran</CardDescription><CardTitle className="text-2xl">{rupiah(expense)}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Margin Riil · {summaries.length} project</CardDescription><CardTitle className="text-2xl">{rupiah(income - expense)}</CardTitle></CardHeader></Card></div><ProjectResults rows={summaries} /><div className="grid gap-4 xl:grid-cols-2"><History title="Riwayat Omset" rows={incomes} income /><History title="Riwayat Pengeluaran" rows={expenses} income={false} /></div><ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} projects={summaries} onSaved={refresh} /></main>;
}

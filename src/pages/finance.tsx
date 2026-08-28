import { useCallback, useEffect, useMemo, useState } from "react";
import { Ellipsis, Plus, ReceiptText, Trash2, WalletCards } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseDialog } from "@/features/finance/expense-dialog";
import { deleteExpenseTransaction, listExpenseTransactions, listIncomeTransactions, listProjectFinancialSummaries, syncExistingOrderIncomes } from "@/features/finance/finance-repository";
import type { IncomeTransaction, ProjectFinancialSummary } from "@/features/finance/finance-repository";

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function History({ title, rows, income, onDeleteExpense }: { title: string; rows: IncomeTransaction[]; income: boolean; onDeleteExpense?: (row: IncomeTransaction) => void }) {
  const Icon = income ? WalletCards : ReceiptText;
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-3 md:px-5">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg"><Icon className="size-4" />{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{income ? "Omset dari pesanan project." : "Biaya riil yang sudah dicatat."}</CardDescription>
      </CardHeader>
      <CardContent className="px-3 md:px-5">
        <div className="grid gap-2 md:hidden">
          {rows.map((row) => (
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 rounded-md border px-2.5 py-2" key={row.id}>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{row.project_name}</p>
                <p className="text-xs text-muted-foreground">{row.transaction_date}</p>
                {!income && row.notes && <p className="truncate text-xs text-muted-foreground">{row.notes}</p>}
              </div>
              <div className="flex items-center gap-1">
                <p className="self-center text-right text-xs font-semibold">{rupiah(row.amount)}</p>
                {!income && onDeleteExpense && <Button size="icon" variant="ghost" aria-label="Hapus pengeluaran" onClick={() => onDeleteExpense(row)}><Trash2 /></Button>}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="py-3 text-center text-xs text-muted-foreground">Belum ada transaksi tercatat.</p>}
        </div>
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>{income ? "Pesanan" : "Catatan"}</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              {!income && <TableHead className="w-16 text-center">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.transaction_date}</TableCell>
                <TableCell><div className="flex flex-col"><span>{row.project_name}</span><span className="text-xs text-muted-foreground">{row.project_code}</span></div></TableCell>
                <TableCell>{income ? <Badge variant="secondary">{row.installment_name || "Pemasukan"}</Badge> : row.notes || "-"}</TableCell>
                <TableCell className="text-right font-medium">{rupiah(row.amount)}</TableCell>
                {!income && (
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Aksi pengeluaran"><Ellipsis /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onSelect={() => onDeleteExpense?.(row)}><Trash2 data-icon="inline-start" />Hapus pengeluaran</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={income ? 4 : 5} className="py-10 text-center text-muted-foreground">Belum ada transaksi tercatat.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProjectResults({ rows }: { rows: ProjectFinancialSummary[] }) {
  return (
    <Card className="py-4">
      <CardContent className="px-3 md:px-5">
        <div className="grid gap-2 md:hidden">
          {rows.map((row) => <div className="flex items-center justify-between gap-3 rounded-md border px-2.5 py-2" key={row.project_id}><div className="min-w-0"><p className="truncate text-xs font-medium">{row.project_name}</p><p className="text-xs text-muted-foreground">{row.project_code}</p></div><p className="shrink-0 text-xs font-semibold">{rupiah(row.income_amount - row.expense_amount)}</p></div>)}
          {rows.length === 0 && <p className="py-3 text-center text-xs text-muted-foreground">Belum ada project yang memiliki pesanan.</p>}
        </div>
        <Table className="hidden md:table">
          <TableHeader><TableRow><TableHead>Project</TableHead><TableHead className="text-center">Pesanan</TableHead><TableHead className="text-right">Omset</TableHead><TableHead className="text-right">Pengeluaran</TableHead><TableHead className="text-right">Margin Riil</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((row) => <TableRow key={row.project_id}><TableCell><div className="flex flex-col"><span className="font-medium">{row.project_name}</span><span className="text-xs text-muted-foreground">{row.project_code}</span></div></TableCell><TableCell className="text-center">{row.order_count}</TableCell><TableCell className="text-right">{rupiah(row.income_amount)}</TableCell><TableCell className="text-right">{rupiah(row.expense_amount)}</TableCell><TableCell className="text-right font-semibold">{rupiah(row.income_amount - row.expense_amount)}</TableCell></TableRow>)}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada project yang memiliki pesanan.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function FinancePage() {
  const monitorOnly = /Android/i.test(navigator.userAgent);
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<IncomeTransaction[]>([]);
  const [summaries, setSummaries] = useState<ProjectFinancialSummary[]>([]);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<IncomeTransaction | null>(null);

  const refresh = useCallback(async () => {
    if (!monitorOnly) await syncExistingOrderIncomes();
    const [incomeRows, expenseRows, summaryRows] = await Promise.all([listIncomeTransactions(), listExpenseTransactions(), listProjectFinancialSummaries()]);
    setIncomes(incomeRows); setExpenses(expenseRows); setSummaries(summaryRows);
  }, [monitorOnly]);

  useEffect(() => { void refresh().catch(console.error); }, [refresh]);

  const removeExpense = async () => {
    if (!deletingExpense) return;
    await deleteExpenseTransaction(deletingExpense.id);
    setDeletingExpense(null);
    await refresh();
  };

  const income = useMemo(() => summaries.reduce((sum, row) => sum + row.income_amount, 0), [summaries]);
  const expense = useMemo(() => summaries.reduce((sum, row) => sum + row.expense_amount, 0), [summaries]);
  const eligibleCount = summaries.filter((project) => project.has_invoice && project.has_nota).length;

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 py-4 pb-20 md:gap-5 md:p-6">
      <section><h1 className="text-xl font-semibold">Keuangan</h1><p className="mt-1 text-xs text-muted-foreground md:text-sm">Pantau omset, pengeluaran, dan margin riil.</p></section>
      <section className="grid grid-cols-3 gap-2.5 md:gap-4">
        <Card className="gap-2 py-3"><CardHeader className="px-3"><CardDescription className="text-xs">Omset</CardDescription><CardTitle className="text-sm">{rupiah(income)}</CardTitle></CardHeader></Card>
        <Card className="gap-2 py-3"><CardHeader className="px-3"><CardDescription className="text-xs">Pengeluaran</CardDescription><CardTitle className="text-sm">{rupiah(expense)}</CardTitle></CardHeader></Card>
        <Card className="gap-2 py-3"><CardHeader className="px-3"><CardDescription className="text-xs">Margin</CardDescription><CardTitle className="text-sm">{rupiah(income - expense)}</CardTitle></CardHeader></Card>
      </section>
      <ProjectResults rows={summaries} />
      <section className="grid gap-3 xl:grid-cols-2">
        <History title="Riwayat Omset" rows={incomes} income />
        <History title="Riwayat Pengeluaran" rows={expenses} income={false} onDeleteExpense={setDeletingExpense} />
      </section>
      {!expenseOpen && <Button className="fixed right-4 bottom-20 z-[60] hidden h-12 rounded-full px-4 shadow-lg md:flex md:right-6 md:bottom-6 md:size-12 md:px-0" onClick={() => setExpenseOpen(true)} disabled={!eligibleCount} aria-label="Input pengeluaran" title="Input pengeluaran"><Plus /></Button>}
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} projects={summaries} onSaved={refresh} />
      <AlertDialog open={Boolean(deletingExpense)} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>Pengeluaran {deletingExpense ? rupiah(deletingExpense.amount) : ""} untuk project {deletingExpense?.project_name} akan dihapus dari riwayat keuangan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void removeExpense()}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

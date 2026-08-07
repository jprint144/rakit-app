import { useEffect, useMemo, useState } from "react";
import { ReceiptText, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listExpenseTransactions,
  listIncomeTransactions,
  syncExistingOrderIncomes,
} from "@/features/finance/finance-repository";
import type { IncomeTransaction } from "@/features/finance/finance-repository";
import { listProjects } from "@/features/project/project-repository";
import type { Project } from "@/features/project/project-repository";

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

function History({
  title,
  rows,
  income,
}: {
  title: string;
  rows: IncomeTransaction[];
  income: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {income ? <WalletCards /> : <ReceiptText />}
          {title}
        </CardTitle>
        <CardDescription>
          {income
            ? "Pemasukan seperti DP, termin revisi, dan pelunasan."
            : "Biaya yang dicatat dari tiap project."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>{income ? "Termin" : "Catatan"}</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.transaction_date}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{row.project_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.project_code}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {income ? (
                    <Badge variant="secondary">
                      {row.installment_name || "Pemasukan"}
                    </Badge>
                  ) : (
                    row.notes || "-"
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {rupiah(row.amount)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Belum ada transaksi tercatat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function FinancePage() {
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<IncomeTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    syncExistingOrderIncomes().then(() => Promise.all([
      listProjects(),
      listIncomeTransactions(),
      listExpenseTransactions(),
    ]))
      .then(([projectRows, incomeRows, expenseRows]) => {
        setProjects(projectRows);
        setIncomes(incomeRows);
        setExpenses(expenseRows);
      })
      .catch(console.error);
  }, []);

  const income = useMemo(
    () => incomes.reduce((sum, row) => sum + row.amount, 0),
    [incomes],
  );
  const expense = useMemo(
    () => expenses.reduce((sum, row) => sum + row.amount, 0),
    [expenses],
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Keuangan</h1>
          <p className="text-muted-foreground">
            Ringkasan pemasukan, pengeluaran, dan margin semua project.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Omset</CardDescription>
            <CardTitle className="text-2xl">{rupiah(income)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pengeluaran</CardDescription>
            <CardTitle className="text-2xl">{rupiah(expense)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Margin · {projects.length} project</CardDescription>
            <CardTitle className="text-2xl">{rupiah(income - expense)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <History title="Riwayat Pemasukan" rows={incomes} income />
        <History title="Riwayat Pengeluaran" rows={expenses} income={false} />
      </div>
    </main>
  );
}
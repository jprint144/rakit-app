import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveExpenseTransaction } from "@/features/finance/finance-repository";
import type { ProjectFinancialSummary } from "@/features/finance/finance-repository";

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export function ExpenseDialog({
  open,
  onOpenChange,
  projects,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectFinancialSummary[];
  onSaved: () => Promise<void>;
}) {
  const eligibleProjects = useMemo(
    () => projects.filter((project) => project.has_invoice && project.has_nota),
    [projects],
  );
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setProjectId(String(eligibleProjects[0]?.project_id ?? ""));
    setAmount("");
    setTransactionDate(today());
    setNotes("");
    setError("");
  }, [open, eligibleProjects]);

  const selectedProject = eligibleProjects.find(
    (project) => project.project_id === Number(projectId),
  );

  const save = async () => {
    if (!projectId || !amount || !transactionDate) return;
    setSaving(true);
    setError("");
    try {
      await saveExpenseTransaction({
        project_id: projectId,
        amount,
        transaction_date: transactionDate,
        notes: notes.trim(),
      });
      await onSaved();
      onOpenChange(false);
    } catch (caughtError) {
      console.error(caughtError);
      setError("Pengeluaran gagal disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full px-6 py-6 sm:max-w-md">
        <SheetHeader className="px-0 pt-0">
          <SheetTitle>Catat Pengeluaran Project</SheetTitle>
          <SheetDescription>
            Pilih project yang pesanan, Invoice, dan Notanya telah selesai untuk mencatat biaya riil.
          </SheetDescription>
        </SheetHeader>
        {eligibleProjects.length === 0 ? (
          <div className="flex flex-1 flex-col justify-between gap-6 py-6">
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada project dengan pesanan serta Invoice dan Nota. Buat kedua dokumen tersebut terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="expense-project">Project</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="expense-project" className="w-full"><SelectValue placeholder="Pilih project" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                  {eligibleProjects.map((project) => (
                    <SelectItem key={project.project_id} value={String(project.project_id)}>
                      {project.project_code} — {project.project_name}
                    </SelectItem>
                  ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex flex-col gap-1"><p className="text-xs text-muted-foreground">Pesanan</p><p className="font-medium">{selectedProject.order_count}</p></div>
                <div className="flex flex-col gap-1"><p className="text-xs text-muted-foreground">Omset</p><p className="font-medium">{rupiah(selectedProject.income_amount)}</p></div>
                <div className="flex flex-col gap-1"><p className="text-xs text-muted-foreground">Margin</p><p className="font-medium">{rupiah(selectedProject.income_amount - selectedProject.expense_amount)}</p></div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="expense-amount">Nominal pengeluaran</label>
              <Input id="expense-amount" inputMode="numeric" placeholder="Contoh: 150.000" value={amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : ""} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="expense-date">Tanggal</label>
              <Input id="expense-date" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="expense-notes">Catatan</label>
              <Textarea id="expense-notes" rows={4} placeholder="Contoh: biaya cetak, vendor, atau transport" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>
        )}
        <SheetFooter className="px-0 pb-0 pt-1">
          {eligibleProjects.length === 0 ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button onClick={() => void save()} disabled={!projectId || !amount || !transactionDate || saving}>
                {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

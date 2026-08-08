import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Pengeluaran Project</DialogTitle>
          <DialogDescription>
            Pilih project yang pesanan, Invoice, dan Notanya telah selesai untuk mencatat biaya riil.
          </DialogDescription>
        </DialogHeader>
        {eligibleProjects.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada project dengan pesanan serta Invoice dan Nota. Buat kedua dokumen tersebut terlebih dahulu.
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="expense-project">Project</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="expense-project"><SelectValue placeholder="Pilih project" /></SelectTrigger>
                <SelectContent>
                  {eligibleProjects.map((project) => (
                    <SelectItem key={project.project_id} value={String(project.project_id)}>
                      {project.project_code} — {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/40 p-3 text-sm">
                <div><p className="text-muted-foreground">Pesanan</p><p className="mt-1 font-medium">{selectedProject.order_count}</p></div>
                <div><p className="text-muted-foreground">Omset</p><p className="mt-1 font-medium">{rupiah(selectedProject.income_amount)}</p></div>
                <div><p className="text-muted-foreground">Margin saat ini</p><p className="mt-1 font-medium">{rupiah(selectedProject.income_amount - selectedProject.expense_amount)}</p></div>
              </div>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="expense-amount">Nominal pengeluaran</label>
              <Input id="expense-amount" inputMode="numeric" placeholder="Contoh: 150.000" value={amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : ""} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="expense-date">Tanggal</label>
              <Input id="expense-date" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="expense-notes">Catatan</label>
              <Textarea id="expense-notes" placeholder="Contoh: biaya cetak, vendor, atau transport" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => void save()} disabled={!projectId || !amount || !transactionDate || saving}>
            {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

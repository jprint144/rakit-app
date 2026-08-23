import { useEffect, useState } from "react";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { Download, FolderOpen, Image, Moon, Plus, Save, Sun, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadInvoiceSettings, saveInvoiceSettings, type InvoiceSettings } from "@/features/finance/finance-repository";
import { deleteIdeaCategory, listIdeaCategories, presetIdeaCategories, saveIdeaCategories } from "@/features/idea/idea-repository";
import { deleteReferenceCategory, listReferenceCategories, presetReferenceCategories, saveReferenceCategories } from "@/features/reference/reference-repository";
import { loadProjectsRoot, loadTheme, saveProjectsRoot, saveTheme } from "@/features/settings/settings-repository";
import { createBackup, restoreBackup, type RakitBackup } from "@/features/settings/backup-repository";

export default function SettingsPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [referenceCategories, setReferenceCategories] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [referenceName, setReferenceName] = useState("");
  const [projectsRoot, setProjectsRoot] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [pendingBackup, setPendingBackup] = useState<RakitBackup | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);

  const loadCategories = () => listIdeaCategories().then(setCategories).catch(console.error);

  useEffect(() => {
    loadCategories();
    listReferenceCategories().then(setReferenceCategories).catch(console.error);
    loadProjectsRoot().then(setProjectsRoot).catch(console.error);
    loadTheme().then(setTheme).catch(console.error);
    loadInvoiceSettings().then((settings) => {
      setInvoiceSettings(settings);
      setAgencyName(settings.agency_name);
      setLogoPath(settings.logo_path);
    }).catch(console.error);
  }, []);

  const saveCategories = async (next: string[]) => {
    const removed = categories.find((item) => !next.includes(item) && !presetIdeaCategories.includes(item));
    if (removed) { await deleteIdeaCategory(removed); toast.success(`Kategori ${removed} dipindahkan ke ${presetIdeaCategories[0]}.`); }
    else await saveIdeaCategories(next.filter((item) => !presetIdeaCategories.includes(item)));
    setCategories(next);
  };
  const addCategory = () => {
    const value = name.trim();
    if (value && !categories.some((item) => item.toLowerCase() === value.toLowerCase())) void saveCategories([...categories, value]);
    setName("");
  };
  const saveReferenceCategoryList = async (next: string[]) => {
    const removed = referenceCategories.find((item) => !next.includes(item) && !presetReferenceCategories.includes(item));
    if (removed) { await deleteReferenceCategory(removed); toast.success(`Kategori ${removed} dipindahkan ke ${presetReferenceCategories[0]}.`); }
    else await saveReferenceCategories(next.filter((item) => !presetReferenceCategories.includes(item)));
    setReferenceCategories(next);
  };
  const addReferenceCategory = () => {
    const value = referenceName.trim();
    if (value && !referenceCategories.some((item) => item.toLowerCase() === value.toLowerCase())) void saveReferenceCategoryList([...referenceCategories, value]);
    setReferenceName("");
  };
  const changeTheme = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    void saveTheme(next);
  };
  const saveRoot = async () => {
    const path = projectsRoot.trim();
    if (!path) { toast.error("Pilih folder utama terlebih dahulu."); return; }
    try { await saveProjectsRoot(path); setProjectsRoot(path); toast.success("Folder utama diperbarui. Project lama tidak dipindahkan."); }
    catch (error) { console.error(error); toast.error("Folder utama gagal disimpan."); }
  };
  const chooseRoot = async () => {
    try { const path = await open({ directory: true, multiple: false }); if (typeof path === "string") setProjectsRoot(path); }
    catch (error) { console.error(error); toast.error("Folder tidak dapat dipilih."); }
  };
  const chooseLogo = async () => {
    try {
      const selected = await open({ multiple: false, filters: [{ name: "Logo", extensions: ["png", "jpg", "jpeg"] }] });
      if (typeof selected !== "string") return;
      const extension = selected.split(".").pop()?.toLowerCase() || "png";
      const localName = `invoice-logo.${extension}`;
      await writeFile(localName, await readFile(selected), { baseDir: BaseDirectory.AppLocalData });
      const localDirectory = await appLocalDataDir();
      setLogoPath(`${localDirectory}${localDirectory.endsWith("\\") ? "" : "\\"}${localName}`);
    } catch (error) { console.error(error); toast.error("Logo gagal dipilih."); }
  };
  const saveAgencyIdentity = async () => {
    if (!invoiceSettings) return;
    try {
      const next = { ...invoiceSettings, agency_name: agencyName.trim(), logo_path: logoPath };
      await saveInvoiceSettings(next);
      setInvoiceSettings(next);
      toast.success("Identitas agency diperbarui.");
    } catch (error) { console.error(error); toast.error("Identitas agency gagal disimpan."); }
  };
  const exportBackup = async () => {
    setBackupBusy(true);
    try {
      const path = await save({ defaultPath: `rakit-backup-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: "Backup Rakit", extensions: ["json"] }] });
      if (!path) return;
      await writeFile(path, new TextEncoder().encode(JSON.stringify(await createBackup(), null, 2)));
      toast.success("Backup data berhasil diexport.");
    } catch (error) { console.error(error); toast.error("Backup data gagal diexport."); }
    finally { setBackupBusy(false); }
  };
  const chooseBackup = async () => {
    try {
      const path = await open({ multiple: false, filters: [{ name: "Backup Rakit", extensions: ["json"] }] });
      if (typeof path !== "string") return;
      const backup = JSON.parse(new TextDecoder().decode(await readFile(path))) as RakitBackup;
      setPendingBackup(backup);
    } catch (error) { console.error(error); toast.error("File backup tidak dapat dibaca."); }
  };
  const importBackup = async () => {
    if (!pendingBackup) return;
    setBackupBusy(true);
    try {
      await restoreBackup(pendingBackup);
      toast.success("Data berhasil dipulihkan. Aplikasi akan dimuat ulang.");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) { console.error(error); toast.error(error instanceof Error ? error.message : "Data backup gagal dipulihkan."); }
    finally { setBackupBusy(false); setPendingBackup(null); }
  };

  return <div className="flex flex-1 flex-col gap-4 p-4">
    <div><h1 className="text-2xl font-semibold">Settings</h1><p className="text-muted-foreground">Kelola pengaturan aplikasi Rakit.</p></div>
    <Card className="max-w-2xl"><CardHeader><CardTitle>Tema</CardTitle><CardDescription>Pilih tampilan terang atau gelap. Pilihan disimpan otomatis.</CardDescription></CardHeader><CardContent className="flex gap-2"><Button variant={theme === "light" ? "default" : "outline"} onClick={() => changeTheme("light")}><Sun data-icon="inline-start" />Terang</Button><Button variant={theme === "dark" ? "default" : "outline"} onClick={() => changeTheme("dark")}><Moon data-icon="inline-start" />Gelap</Button></CardContent></Card>
    <Card className="max-w-2xl"><CardHeader><CardTitle>Folder Utama Project</CardTitle><CardDescription>Project baru dan folder Arsip akan dibuat di lokasi ini. Project lama tidak dipindahkan otomatis.</CardDescription></CardHeader><CardContent className="flex gap-2"><Input value={projectsRoot} onChange={(event) => setProjectsRoot(event.target.value)} /><Button size="icon" variant="outline" onClick={() => void chooseRoot()} aria-label="Pilih folder utama"><FolderOpen /></Button><Button onClick={() => void saveRoot()}><Save data-icon="inline-start" />Simpan</Button></CardContent></Card>
    <Card className="max-w-2xl"><CardHeader><CardTitle>Identitas Agency</CardTitle><CardDescription>Nama dan logo ini digunakan oleh Invoice dan Nota baru.</CardDescription></CardHeader><CardContent className="grid gap-3"><Input value={agencyName} onChange={(event) => setAgencyName(event.target.value)} placeholder="Nama agency" /><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={() => void chooseLogo()}><Image data-icon="inline-start" />Pilih Logo</Button><span className="text-sm text-muted-foreground">{logoPath ? "Logo sudah dipilih." : "Logo belum dipilih."}</span></div><div><Button onClick={() => void saveAgencyIdentity()} disabled={!invoiceSettings}><Save data-icon="inline-start" />Simpan Identitas</Button></div></CardContent></Card>
    <Card className="max-w-2xl"><CardHeader><CardTitle>Kategori Idea</CardTitle><CardDescription>Kategori preset tidak dapat dihapus. Tambahkan kategori baru untuk dipakai pada Idea.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="flex gap-2"><Input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addCategory())} placeholder="Nama kategori baru" /><Button onClick={addCategory}><Plus data-icon="inline-start" />Tambah</Button></div><div className="flex flex-wrap gap-2">{categories.map((category) => <Badge key={category} variant={presetIdeaCategories.includes(category) ? "secondary" : "outline"} className="gap-1 py-1.5">{category}{!presetIdeaCategories.includes(category) && <button type="button" aria-label={`Hapus ${category}`} onClick={() => void saveCategories(categories.filter((item) => item !== category))}><Trash2 className="size-3" /></button>}</Badge>)}</div></CardContent></Card>
    <Card className="max-w-2xl"><CardHeader><CardTitle>Kategori Reference</CardTitle><CardDescription>Tambahkan kategori agar muncul sebagai pilihan saat menyimpan website Reference.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="flex gap-2"><Input value={referenceName} onChange={(event) => setReferenceName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addReferenceCategory())} placeholder="Nama kategori baru" /><Button onClick={addReferenceCategory}><Plus data-icon="inline-start" />Tambah</Button></div><div className="flex flex-wrap gap-2">{referenceCategories.map((category) => <Badge key={category} variant={presetReferenceCategories.includes(category) ? "secondary" : "outline"} className="gap-1 py-1.5">{category}{!presetReferenceCategories.includes(category) && <button type="button" aria-label={`Hapus ${category}`} onClick={() => void saveReferenceCategoryList(referenceCategories.filter((item) => item !== category))}><Trash2 className="size-3" /></button>}</Badge>)}</div></CardContent></Card>
    <Card className="max-w-2xl"><CardHeader><CardTitle>Backup Data</CardTitle><CardDescription>Export seluruh data Rakit sebagai file backup. Import akan menggantikan seluruh data yang sedang ada.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button onClick={() => void exportBackup()} disabled={backupBusy}><Download data-icon="inline-start" />Export Backup</Button><Button variant="outline" onClick={() => void chooseBackup()} disabled={backupBusy}><Upload data-icon="inline-start" />Import Backup</Button></CardContent></Card>
    <AlertDialog open={Boolean(pendingBackup)} onOpenChange={(value) => !value && setPendingBackup(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Pulihkan data dari backup?</AlertDialogTitle><AlertDialogDescription>Seluruh data Rakit yang saat ini tersimpan akan digantikan oleh isi backup ini. Folder project dan lampiran Idea yang berada di luar data aplikasi tidak diubah.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={backupBusy}>Batal</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void importBackup(); }} disabled={backupBusy}>Pulihkan Data</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

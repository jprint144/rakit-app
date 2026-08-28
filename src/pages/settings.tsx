import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { Download, FolderOpen, Image, Moon, Plus, RefreshCw, Save, Sun, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { loadInvoiceSettings, saveInvoiceSettings, type InvoiceSettings } from "@/features/finance/finance-repository";
import { deleteIdeaCategory, listIdeaCategories, presetIdeaCategories, saveIdeaCategories } from "@/features/idea/idea-repository";
import { deleteReferenceCategory, listReferenceCategories, presetReferenceCategories, saveReferenceCategories } from "@/features/reference/reference-repository";
import { loadProjectsRoot, loadTheme, saveProjectsRoot, saveTheme } from "@/features/settings/settings-repository";
import { syncWindowIcon } from "@/lib/window-icon";
import { supabase } from "@/lib/supabase";
import { syncRakitEditableData } from "@/features/sync/supabase-sync";
import { createBackup, parseBackup, restoreBackup, type RakitBackup } from "@/features/settings/backup-repository";

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
  const [accountEmail, setAccountEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountAvatar, setAccountAvatar] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

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
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setAccountEmail(user?.email ?? "");
      setAccountName(user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0] ?? "");
      setAccountAvatar(user?.user_metadata.avatar_url ?? user?.user_metadata.picture ?? "");
    });
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
    void syncWindowIcon(next).catch(console.error);
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
      const backup = parseBackup(JSON.parse(new TextDecoder().decode(await readFile(path))));
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
  const signOut = async () => { const { error } = await supabase.auth.signOut(); if (error) toast.error(error.message); };
  const saveProfile = async () => {
    const name = accountName.trim();
    if (!name) return toast.error("Nama akun tidak boleh kosong.");
    setProfileBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name, name, avatar_url: accountAvatar } });
      if (error) throw error;
      toast.success("Profil akun diperbarui.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Profil akun gagal disimpan."); }
    finally { setProfileBusy(false); }
  };
  const chooseAvatar = async () => {
    try {
      const path = await open({ multiple: false, filters: [{ name: "Avatar", extensions: ["png", "jpg", "jpeg", "webp"] }] });
      if (typeof path !== "string") return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return toast.error("Silakan masuk kembali.");
      setProfileBusy(true);
      const extension = path.split(".").pop()?.toLowerCase() || "png";
      const objectPath = `${userData.user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(objectPath, await readFile(path), { upsert: true, contentType: `image/${extension === "jpg" ? "jpeg" : extension}` });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(objectPath);
      const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase.auth.updateUser({ data: { full_name: accountName.trim(), name: accountName.trim(), avatar_url: avatarUrl } });
      if (profileError) throw profileError;
      setAccountAvatar(avatarUrl);
      toast.success("Avatar akun diperbarui.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Avatar gagal diunggah."); }
    finally { setProfileBusy(false); }
  };
  const syncNow = async () => {
    try { const result = await syncRakitEditableData(); toast.success(`Sinkron selesai: ${result.pushed} dikirim, ${result.pulled} diperbarui.`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Sinkronisasi gagal."); }
  };

  return <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-5 md:px-8 md:py-7">
    <div className="flex max-w-2xl flex-col gap-1"><h1 className="text-2xl font-semibold">Pengaturan</h1><p className="text-sm text-muted-foreground">Atur akun, workspace, identitas dokumen, kategori, dan keamanan data Rakit.</p></div>
     <div className="grid items-start gap-5 xl:grid-cols-2">
       <div className="xl:col-span-2"><p className="text-sm font-medium">Akun</p><p className="text-sm text-muted-foreground">Kelola identitas dan sinkronisasi akun Rakit.</p></div>
       <Card className="xl:col-span-2"><CardContent className="grid gap-5 md:grid-cols-3 md:gap-0"><div className="flex min-w-0 items-center gap-4"><Avatar className="size-20"><AvatarImage src={accountAvatar} alt={accountName || "Avatar akun"} /><AvatarFallback><UserRound /></AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{accountName || "Belum masuk"}</p><p className="truncate text-sm text-muted-foreground">{accountEmail || "Masuk untuk mengelola akun"}</p></div></div><div className="flex flex-col justify-center gap-3 border-t pt-5 md:border-t-0 md:border-l md:px-6 md:pt-0"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="account-name">Nama tampilan</label><div className="flex gap-2"><Input id="account-name" value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Nama Anda" /><Button size="icon" aria-label="Simpan nama" onClick={() => void saveProfile()} disabled={!accountEmail || profileBusy}><Save /></Button></div></div><Button size="sm" className="w-full" onClick={() => void chooseAvatar()} disabled={!accountEmail || profileBusy}><Image data-icon="inline-start" />Ubah avatar</Button></div><div className="flex flex-col justify-center gap-2 border-t pt-5 md:border-t-0 md:border-l md:pl-6 md:pt-0"><p className="text-sm font-medium">Sinkronisasi akun</p><Button size="sm" variant="outline" onClick={() => void syncNow()}><RefreshCw data-icon="inline-start" />Sinkronkan</Button><Button size="sm" variant="ghost" onClick={() => void signOut()}>Keluar akun</Button></div></CardContent></Card>
      <div className="xl:col-span-2"><p className="text-sm font-medium">Workspace & tampilan</p><p className="text-sm text-muted-foreground">Atur cara Rakit terlihat dan lokasi kerja project.</p></div>
      <Card className="h-full"><CardHeader className="gap-1"><CardTitle>Tampilan</CardTitle><CardDescription>Pilihan diterapkan dan disimpan otomatis.</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-2"><Button variant={theme === "light" ? "default" : "outline"} onClick={() => changeTheme("light")}><Sun data-icon="inline-start" />Terang</Button><Button variant={theme === "dark" ? "default" : "outline"} onClick={() => changeTheme("dark")}><Moon data-icon="inline-start" />Gelap</Button></CardContent></Card>
      <Card><CardHeader className="gap-1"><CardTitle>Folder Utama Project</CardTitle><CardDescription>Dipakai untuk project dan Arsip baru; project lama tidak dipindahkan.</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><Input value={projectsRoot} onChange={(event) => setProjectsRoot(event.target.value)} aria-label="Lokasi folder utama project" /><Button size="icon" variant="outline" onClick={() => void chooseRoot()} aria-label="Pilih folder utama"><FolderOpen /></Button><Button onClick={() => void saveRoot()}><Save data-icon="inline-start" />Simpan</Button></CardContent></Card>
      <div className="xl:col-span-2"><p className="text-sm font-medium">Identitas Agency</p><p className="text-sm text-muted-foreground">Digunakan untuk Invoice dan Nota baru.</p></div>
      <Card className="xl:col-span-2"><CardContent className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_38rem]"><div className="grid gap-4"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="agency-name">Nama agency</label><div className="flex gap-2"><Input id="agency-name" value={agencyName} onChange={(event) => setAgencyName(event.target.value)} placeholder="Nama agency" /><Button onClick={() => void saveAgencyIdentity()} disabled={!invoiceSettings}><Save data-icon="inline-start" />Simpan</Button></div></div><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={() => void chooseLogo()}><Image data-icon="inline-start" />Pilih Logo</Button><Badge variant="secondary">{logoPath ? "Logo dipilih" : "Tanpa logo"}</Badge></div></div><div className="grid grid-cols-2 gap-4"><div className="flex h-32 w-full items-start justify-center overflow-hidden rounded-md border"><>{logoPath ? <img src={convertFileSrc(logoPath)} alt="Preview logo tanpa latar" className="size-full object-contain object-top" /> : <Image className="text-muted-foreground" />}</></div><div className="flex h-32 w-full items-start justify-center overflow-hidden rounded-md border bg-white"><>{logoPath ? <img src={convertFileSrc(logoPath)} alt="Preview logo berlatar putih" className="size-full object-contain object-top" /> : <Image className="text-muted-foreground" />}</></div></div></CardContent></Card>
      <div className="xl:col-span-2"><p className="text-sm font-medium">Organisasi konten</p><p className="text-sm text-muted-foreground">Kelola kategori untuk menyusun Idea dan Reference.</p></div>
      <Card className="h-full"><CardHeader className="gap-1"><CardTitle>Kategori Idea</CardTitle><CardDescription>Kategori preset selalu tersedia; kategori tambahan dapat dihapus.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="flex flex-col gap-2 sm:flex-row"><Input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addCategory())} placeholder="Kategori baru" /><Button onClick={addCategory}><Plus data-icon="inline-start" />Tambah</Button></div><div className="flex flex-wrap gap-2">{categories.map((category) => <Badge key={category} variant={presetIdeaCategories.includes(category) ? "secondary" : "outline"} className="gap-1 py-1.5">{category}{!presetIdeaCategories.includes(category) && <button type="button" aria-label={`Hapus ${category}`} onClick={() => void saveCategories(categories.filter((item) => item !== category))}><Trash2 className="size-3" /></button>}</Badge>)}</div></CardContent></Card>
      <Card className="h-full"><CardHeader className="gap-1"><CardTitle>Kategori Reference</CardTitle><CardDescription>Kelompokkan website referensi agar lebih mudah ditemukan.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="flex flex-col gap-2 sm:flex-row"><Input value={referenceName} onChange={(event) => setReferenceName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addReferenceCategory())} placeholder="Kategori baru" /><Button onClick={addReferenceCategory}><Plus data-icon="inline-start" />Tambah</Button></div><div className="flex flex-wrap gap-2">{referenceCategories.map((category) => <Badge key={category} variant={presetReferenceCategories.includes(category) ? "secondary" : "outline"} className="gap-1 py-1.5">{category}{!presetReferenceCategories.includes(category) && <button type="button" aria-label={`Hapus ${category}`} onClick={() => void saveReferenceCategoryList(referenceCategories.filter((item) => item !== category))}><Trash2 className="size-3" /></button>}</Badge>)}</div></CardContent></Card>
      <div className="xl:col-span-2"><p className="text-sm font-medium">Data</p><p className="text-sm text-muted-foreground">Simpan cadangan sebelum berpindah perangkat atau melakukan perubahan besar.</p></div>
      <Card className="border-primary/30 xl:col-span-2"><CardHeader className="gap-1"><CardTitle>Backup Data</CardTitle><CardDescription>Simpan salinan data secara berkala. Import akan menggantikan seluruh data saat ini setelah konfirmasi.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button onClick={() => void exportBackup()} disabled={backupBusy}><Download data-icon="inline-start" />Export Backup</Button><Button variant="outline" onClick={() => void chooseBackup()} disabled={backupBusy}><Upload data-icon="inline-start" />Import Backup</Button></CardContent></Card>
    </div>
    <AlertDialog open={Boolean(pendingBackup)} onOpenChange={(value) => !value && setPendingBackup(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Pulihkan data dari backup?</AlertDialogTitle><AlertDialogDescription>Seluruh data Rakit yang saat ini tersimpan akan digantikan oleh isi backup ini. Folder project dan lampiran Idea yang berada di luar data aplikasi tidak diubah.</AlertDialogDescription></AlertDialogHeader>{pendingBackup && <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-3 text-sm"><span className="col-span-2 text-muted-foreground">Dibuat: {new Date(pendingBackup.created_at).toLocaleString("id-ID")}</span><span>{pendingBackup.data.projects.length} project</span><span>{pendingBackup.data.transactions.length} transaksi</span><span>{pendingBackup.data.ideas.length} Idea</span><span>{pendingBackup.data.reference_items.length} Reference</span></div>}<AlertDialogFooter><AlertDialogCancel disabled={backupBusy}>Batal</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void importBackup(); }} disabled={backupBusy}>Pulihkan Data</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

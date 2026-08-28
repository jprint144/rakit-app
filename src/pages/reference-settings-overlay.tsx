import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { loadTheme } from "@/features/settings/settings-repository";
import {
  deleteReference,
  listReferences,
  listReferenceCategories,
  saveReference,
  updateReference,
} from "@/features/reference/reference-repository";
import type { ReferenceItem } from "@/features/reference/reference-repository";

export default function ReferenceSettingsOverlayPage() {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Umum");
  const [categories, setCategories] = useState<string[]>(["Umum"]);
  const [editing, setEditing] = useState<ReferenceItem | null>(null);
  const [deleting, setDeleting] = useState<ReferenceItem | null>(null);
  const [error, setError] = useState("");
  const load = () => listReferences().then(setItems).catch((cause) => setError(String(cause)));
  const close = async () => {
    await getCurrentWebview().emitTo("main", "reference:settings-closed");
    await getCurrentWebview().close();
  };

  useEffect(() => {
    loadTheme().then((theme) => document.documentElement.classList.toggle("dark", theme === "dark")).catch(console.error);
    load();
    listReferenceCategories().then(setCategories).catch(console.error);
  }, []);

  const save = async () => {
    if (!url.trim()) return setError("URL wajib diisi.");
    let title = "Website";
    try {
      title = new URL(url.trim()).hostname.replace(/^www\.|^id\./, "").split(".")[0].replace(/^./, (letter) => letter.toUpperCase());
    } catch {
      return setError("URL harus valid dan diawali https://.");
    }
    if (editing) await updateReference(editing.id, title, url.trim(), category.trim() || "Umum");
    else await saveReference(title, url.trim(), category.trim() || "Umum");
    setUrl("");
    setCategory("Umum");
    setEditing(null);
    setError("");
    load();
  };

  return <main className="flex min-h-screen flex-col bg-background"><header className="flex items-center justify-between px-6 pt-6"><h1 className="text-lg font-semibold">Pengaturan Reference</h1><Button size="icon" variant="ghost" onClick={close}><X /></Button></header><section className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-6 pb-6 pt-4"><div className="grid gap-4"><Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /><div className="grid gap-2"><p className="text-sm font-medium">Kategori</p><div className="flex flex-wrap gap-2">{categories.map((option) => <Button key={option} size="sm" type="button" variant={category === option ? "default" : "outline"} onClick={() => setCategory(option)}>{option}</Button>)}</div><Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Atau tulis kategori custom" /></div><Button onClick={save}>{editing ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}{editing ? "Simpan perubahan" : "Tambah website"}</Button>{editing && <Button variant="ghost" onClick={() => { setEditing(null); setUrl(""); setCategory("Umum"); }}>Batal edit</Button>}{error && <p className="text-sm text-destructive">{error}</p>}</div><div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto"><p className="text-sm font-medium text-muted-foreground">Website tersimpan</p>{items.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-md border p-2"><img className="size-4 rounded-sm" src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.url)}&sz=32`} alt="" /><div className="min-w-0 flex-1"><p className="truncate text-sm">{item.title}</p><Badge variant="secondary">{item.category}</Badge></div><Button size="icon" variant="ghost" onClick={() => { setEditing(item); setUrl(item.url); setCategory(item.category); }}><Pencil /></Button><Button size="icon" variant="ghost" onClick={() => setDeleting(item)}><Trash2 /></Button></div>)}</div></section><AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus website?</AlertDialogTitle><AlertDialogDescription>{deleting?.title} akan dihapus dari daftar Reference.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (!deleting) return; deleteReference(deleting.id).then(() => { setDeleting(null); load(); }).catch((cause) => setError(String(cause))); }}>Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></main>;
}

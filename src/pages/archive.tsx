import { useEffect, useState } from "react";
import { ArchiveRestore, FolderInput, Eye, FolderOpen, Trash2 } from "lucide-react";
import { openPath } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProject, listArchivedProjects, moveArchivedProjectFolder, restoreProject } from "@/features/project/project-repository";
import { isProjectFolderInArchive } from "@/features/project/project-folders";
import type { Project } from "@/features/project/project-repository";

export default function ArchivePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const load = () => listArchivedProjects().then(setProjects).catch(console.error);
  useEffect(() => { load(); }, []);

  return <><div className="flex flex-1 flex-col gap-5 px-6 py-5 md:px-8"><div><h1 className="text-2xl font-semibold">Archive</h1><p className="text-muted-foreground">Project selesai yang sudah dipindahkan dari daftar utama.</p></div><div className="rounded-2xl border bg-card px-4 shadow-sm"><Table><TableHeader><TableRow><TableHead>No</TableHead><TableHead>Kode</TableHead><TableHead>Project</TableHead><TableHead>Klien</TableHead><TableHead>Deadline</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{projects.map((project, index) => <TableRow key={project.id}><TableCell>{index + 1}</TableCell><TableCell>{project.code}</TableCell><TableCell>{project.name}</TableCell><TableCell>{project.client_name}</TableCell><TableCell>{project.deadline || "-"}</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setSelectedProject(project)}><Eye data-icon="inline-start" />Detail</Button><Button size="sm" variant="ghost" disabled={!project.folder_path} onClick={() => project.folder_path && openPath(project.folder_path).catch(console.error)}><FolderOpen data-icon="inline-start" />Folder</Button>{project.folder_path && !isProjectFolderInArchive(project.folder_path) && <Button size="sm" variant="outline" onClick={() => moveArchivedProjectFolder(project).then(() => { toast.success("Folder project berhasil dipindahkan ke Arsip."); load(); }).catch(() => toast.error("Folder belum dapat dipindahkan. Tutup aplikasi yang memakai file project lalu coba lagi."))}><FolderInput data-icon="inline-start" />Pindahkan Folder</Button>}<Button size="sm" variant="outline" onClick={() => restoreProject(project).then(() => { toast.success("Project dikembalikan ke daftar utama."); load(); }).catch(() => toast.error("Project belum dapat dikembalikan."))}><ArchiveRestore data-icon="inline-start" />Kembalikan</Button><Button size="sm" variant="destructive" onClick={() => setProjectToDelete(project)}><Trash2 data-icon="inline-start" />Hapus</Button></div></TableCell></TableRow>)}{projects.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada project di Archive.</TableCell></TableRow>}</TableBody></Table></div></div><Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}><DialogContent><DialogHeader><DialogTitle>{selectedProject?.name}</DialogTitle><DialogDescription>Detail project yang tersimpan di Archive.</DialogDescription></DialogHeader><dl className="grid gap-3 text-sm"><div className="grid gap-1"><dt className="text-muted-foreground">Kode</dt><dd>{selectedProject?.code}</dd></div><div className="grid gap-1"><dt className="text-muted-foreground">Klien</dt><dd>{selectedProject?.client_name}</dd></div><div className="grid gap-1"><dt className="text-muted-foreground">WhatsApp</dt><dd>{selectedProject?.client_whatsapp || "-"}</dd></div><div className="grid gap-1"><dt className="text-muted-foreground">Deadline</dt><dd>{selectedProject?.deadline || "-"}</dd></div><div className="grid gap-1"><dt className="text-muted-foreground">Status pembayaran</dt><dd>{selectedProject?.payment_status}</dd></div><div className="grid gap-1"><dt className="text-muted-foreground">Brief</dt><dd className="whitespace-pre-wrap">{selectedProject?.brief || "-"}</dd></div></dl><DialogFooter><DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose></DialogFooter></DialogContent></Dialog><AlertDialog open={Boolean(projectToDelete)} onOpenChange={(open) => !open && setProjectToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus project arsip?</AlertDialogTitle><AlertDialogDescription>Project dan folder arsipnya akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => projectToDelete && deleteProject(projectToDelete).then(() => { toast.success("Project arsip berhasil dihapus."); setProjectToDelete(null); load(); }).catch(() => toast.error("Project arsip belum dapat dihapus."))}>Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}

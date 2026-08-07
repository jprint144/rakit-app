import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
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

type AvailableUpdate = Awaited<ReturnType<typeof check>>;

export function UpdateNotification() {
  const [update, setUpdate] = useState<AvailableUpdate>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;

    const timeout = window.setTimeout(() => {
      check().then(setUpdate).catch(() => undefined);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, []);

  const dismiss = () => {
    update?.close().catch(() => undefined);
    setUpdate(null);
  };

  const install = async () => {
    if (!update) return;
    setInstalling(true);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch (error) {
      console.error("Gagal memasang pembaruan", error);
      setInstalling(false);
    }
  };

  return (
    <AlertDialog open={Boolean(update)} onOpenChange={(open) => !open && dismiss()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update tersedia</AlertDialogTitle>
          <AlertDialogDescription>
            Versi {update?.version} tersedia. Update akan diunduh, dipasang, lalu aplikasi dibuka ulang.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={installing}>Nanti saja</AlertDialogCancel>
          <AlertDialogAction onClick={(event) => { event.preventDefault(); install().catch(console.error); }} disabled={installing}>
            {installing ? "Mengunduh update..." : "Update sekarang"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
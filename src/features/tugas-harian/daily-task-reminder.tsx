import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { listDailyTasks } from "@/features/tugas-harian/daily-task-repository";

const POLL_INTERVAL_MS = 15_000;
const REMINDER_GRACE_MS = 60_000;

export async function sendDailyTaskTestNotification() {
  if (!isTauri()) return false;
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (!granted) return false;
  sendNotification({ title: "Tes pengingat Rakit", body: "Notifikasi tugas harian sudah siap digunakan." });
  return true;
}

export function DailyTaskReminder() {
  const notified = useRef(new Set<string>());

  useEffect(() => {
    if (!isTauri()) return;

    let disposed = false;
    let permissionChecked = false;
    let permissionGranted = false;

    const checkReminders = async () => {
      try {
        const now = Date.now();
        const dueTasks = (await listDailyTasks()).filter((task) => {
          if (task.completed || !task.reminder_at) return false;
          const reminderTime = new Date(task.reminder_at).getTime();
          return Number.isFinite(reminderTime) && reminderTime <= now && now - reminderTime <= REMINDER_GRACE_MS;
        });

        if (!dueTasks.length || disposed) return;

        if (!permissionChecked) {
          permissionGranted = await isPermissionGranted();
          if (!permissionGranted) permissionGranted = (await requestPermission()) === "granted";
          permissionChecked = true;
        }
        if (!permissionGranted || disposed) return;

        for (const task of dueTasks) {
          const key = `${task.id}:${task.reminder_at}`;
          if (notified.current.has(key)) continue;
          notified.current.add(key);
          sendNotification({ title: "Pengingat tugas", body: task.title });
        }
      } catch (error) {
        console.warn("Pemeriksaan pengingat tugas gagal", error);
      }
    };

    void checkReminders();
    const interval = window.setInterval(() => void checkReminders(), POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}

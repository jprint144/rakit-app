import type { Project } from "@/features/project/project-repository";

export const paymentStatusLabels: Record<string, string> = {
  unpaid: "Belum Lunas",
  deposit: "DP",
  paid: "Lunas",
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isProjectOverdue(project: Project) {
  return Boolean(
    project.deadline &&
    project.deadline < localDateKey() &&
    project.kanban_status !== "done",
  );
}

export function projectWhatsAppUrl(value: string | null) {
  const number = value?.replace(/\D/g, "");
  if (!number) return null;
  return `https://wa.me/${number.startsWith("0") ? `62${number.slice(1)}` : number}`;
}

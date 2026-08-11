import { join } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
import { exists, writeFile } from "@tauri-apps/plugin-fs";
import type { Project } from "@/features/project/project-repository";

const BRIEF_FILENAME = "brief.txt";

function legacyBriefAsText(value: string | null) {
  return value
    ? value
        .replace(/<br\s*\/?>\s*/gi, "\n")
        .replace(/<\/p>|<\/h[1-6]>|<\/li>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim()
    : "";
}

export async function openProjectBrief(project: Project) {
  if (!project.folder_path) {
    throw new Error("Folder project belum tersedia.");
  }

  const briefPath = await join(project.folder_path, BRIEF_FILENAME);
  if (!(await exists(briefPath))) {
    await writeFile(briefPath, new TextEncoder().encode(legacyBriefAsText(project.brief)));
  }

  await openPath(briefPath, "notepad");
}

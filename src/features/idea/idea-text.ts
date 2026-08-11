import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { exists, mkdir, writeFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import type { Idea } from "@/features/idea/idea-repository";

export async function openIdeaText(idea: Idea) {
  const directory = await join(await appLocalDataDir(), "ideas", String(idea.id));
  if (!(await exists(directory))) await mkdir(directory, { recursive: true });
  const path = await join(directory, "text.txt");
  if (!(await exists(path))) await writeFile(path, new TextEncoder().encode(idea.text_content ?? ""));
  await openPath(path);
}

import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";

export const jobApplicationStatuses = ["Belum apply", "Sudah apply", "Screening", "Interview", "Tes", "Offering", "Diterima", "Ditolak"] as const;
export type JobApplicationStatus = (typeof jobApplicationStatuses)[number];

export const jobApplicationPriorities = ["Rendah", "Normal", "Tinggi"] as const;
export type JobApplicationPriority = (typeof jobApplicationPriorities)[number];

export const jobApplicationPlatforms = ["LinkedIn", "Glints", "JobStreet", "Email", "Website", "Referensi", "Lainnya"] as const;
export type JobApplicationPlatform = (typeof jobApplicationPlatforms)[number];

export type JobApplication = {
  id: number;
  company: string;
  position: string;
  platform: JobApplicationPlatform | string;
  job_url: string | null;
  applied_at: string;
  status: JobApplicationStatus;
  priority: JobApplicationPriority;
  follow_up_at: string | null;
  contact_name: string | null;
  contact_info: string | null;
  salary_range: string | null;
  notes: string | null;
  cv_ready: number;
  portfolio_ready: number;
  cover_letter_ready: number;
  follow_up_sent: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type JobApplicationInput = Pick<JobApplication, "company" | "position" | "platform" | "job_url" | "applied_at" | "status" | "priority" | "follow_up_at" | "contact_name" | "contact_info" | "salary_range" | "notes" | "cv_ready" | "portfolio_ready" | "cover_letter_ready" | "follow_up_sent">;

async function db() {
  return Database.load(DATABASE_URL);
}

export async function listJobApplications() {
  return (await (await db()).select<JobApplication[]>(
    "SELECT id, company, position, platform, job_url, applied_at, status, priority, follow_up_at, contact_name, contact_info, salary_range, notes, cv_ready, portfolio_ready, cover_letter_ready, follow_up_sent, created_at, updated_at, deleted_at FROM job_applications WHERE deleted_at IS NULL ORDER BY updated_at DESC, id DESC",
  ));
}

export async function saveJobApplication(input: JobApplicationInput, id?: number) {
  const database = await db();
  const values = [
    input.company.trim(),
    input.position.trim(),
    input.platform || "LinkedIn",
    input.job_url?.trim() || null,
    input.applied_at || new Date().toISOString().slice(0, 10),
    input.status || "Sudah apply",
    input.priority || "Normal",
    input.follow_up_at || null,
    input.contact_name?.trim() || null,
    input.contact_info?.trim() || null,
    input.salary_range?.trim() || null,
    input.notes?.trim() || null,
    input.cv_ready ? 1 : 0,
    input.portfolio_ready ? 1 : 0,
    input.cover_letter_ready ? 1 : 0,
    input.follow_up_sent ? 1 : 0,
  ];
  if (id) {
    await database.execute(
      "UPDATE job_applications SET company = $1, position = $2, platform = $3, job_url = $4, applied_at = $5, status = $6, priority = $7, follow_up_at = $8, contact_name = $9, contact_info = $10, salary_range = $11, notes = $12, cv_ready = $13, portfolio_ready = $14, cover_letter_ready = $15, follow_up_sent = $16, updated_at = CURRENT_TIMESTAMP WHERE id = $17",
      [...values, id],
    );
    return;
  }
  await database.execute(
    "INSERT INTO job_applications (company, position, platform, job_url, applied_at, status, priority, follow_up_at, contact_name, contact_info, salary_range, notes, cv_ready, portfolio_ready, cover_letter_ready, follow_up_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
    values,
  );
}

export async function updateJobApplicationStatus(id: number, status: JobApplicationStatus) {
  await (await db()).execute("UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [status, id]);
}

export async function deleteJobApplication(id: number) {
  await (await db()).execute("UPDATE job_applications SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

# AGENTS.md — Rakit

Instruksi kerja untuk agent (Claude Code/Codex) yang bekerja di project ini. Baca file ini penuh di awal tiap sesi baru, jangan diloncat.

---

## Startup Workflow (WAJIB tiap sesi baru)

1. Baca `claude-progress.md` bagian **Current Verified State** — cari tahu posisi project sekarang, blocker apa yang masih nyantol.
2. **Baca `PRD-RAKIT.md` full, bukan skim.** Wajib sebelum nyentuh fitur apa pun. Ini acuan requirement tunggal — kalau ada keputusan fungsional/data yang gak ketemu jawabannya di PRD, jangan improvisasi/nebak sendiri, tanya dulu ke user, baru dicatat balik ke PRD.
3. Baca `feature_list.json` — cari entry `status: "in_progress"`. Kalau gak ada, ambil `status: "not_started"` dengan `priority` paling kecil. Urutan `priority` mengikuti section **Roadmap Pengerjaan Bertahap** di PRD (Fondasi → Project → Finance → Idea → Reference → Archive → Dashboard → Settings) — bukan urutan bebas.
4. Jalankan `./init.sh` — pastikan install dependency dan verifikasi baseline (`VERIFY_CMD`) lolos dulu sebelum nyentuh kode apa pun.
5. Kalau baseline gagal, itu prioritas nomor satu, benerin dulu baru lanjut fitur.

## Environment

- OS dev: Windows 11 Pro for Workstations 64-bit
- Hardware: Intel Core i5-12450H, 16GB RAM (MSI Thin GF63 12UC)
- Prasyarat sebelum coding pertama kali: Rust toolchain, Microsoft C++ Build Tools, WebView2 (biasanya sudah bawaan Windows 11) — kalau `tauri dev` gagal di awal, cek 3 hal ini dulu sebelum debug kode.

## Working Rules

- **Satu fitur aktif dalam satu waktu.** Update `status` di `feature_list.json` jadi `in_progress` sebelum mulai ngoding, jangan buka fitur lain di tengah jalan.
- **Ikuti Data Model di `PRD-RAKIT.md` (section 5) secara ketat** buat struktur tabel SQLite, jangan improvisasi field baru tanpa nyocokin ke sana dulu. Kalau ada kebutuhan field baru yang gak ada di PRD, update dulu PRD-nya, baru implementasi.
- **Migrasi schema SQLite:** setiap nambah/ubah kolom di tabel yang sudah ada datanya wajib pakai file migration terpisah, jangan edit schema langsung tanpa migration. Kolom baru wajib nullable atau punya default value, biar data lama gak rusak.
- **Struktur folder kode:** ikutin konvensi `features/<domain>/` (project, finance, idea, reference, archive, dashboard, settings — masing-masing components/hooks/routes sendiri), `lib/` (sqlite client, zustand store, tauri API wrapper), `routes/` (route tree React Router).
- **Base layout wajib** shadcn/ui block `sidebar-07` — jangan ganti/pilih block lain sendiri.
- **Semua styling ikut token shadcn/ui** (class token seperti `bg-primary`, `text-muted-foreground`, dst), jangan hardcode warna hex atau ukuran px manual.
- **Akses file system** (buat folder project, buka folder, pindah folder ke Archive) wajib pakai Tauri API resmi, bukan workaround/plugin lain.
- **Reference browser** pakai webview native Tauri, bukan iframe web.

## Manajemen Konteks & Ukuran Task

User pindah-pindah sesi chat karena keterbatasan token — jadi progress harus selalu tercatat rapi dan bisa dilanjut tanpa nebak-nebak.

- **Pecah dulu sebelum eksekusi.** Sebelum mulai satu entry di `feature_list.json`, breakdown jadi sub-langkah kecil (misal: schema dulu → satu komponen UI → satu handler logic → wiring akhir), bukan langsung ngoding semuanya sekaligus.
- **Satu sub-langkah, satu checkpoint.** Selesai satu sub-langkah kecil → verifikasi cepat (baseline masih lolos) → commit kecil → baru lanjut sub-langkah berikutnya.
- **Awas tanda context udah berat**: sudah baca/edit banyak file berbeda dalam satu sesi, atau breakdown makin susah diikuti. Kalau itu terjadi, berhenti di titik aman, update `claude-progress.md`, biar sesi berikutnya bisa lanjut langsung.
- **Edit terarah, bukan rewrite total.** Targetkan bagian yang relevan aja (function/component spesifik), jangan generate ulang file utuh kalau gak perlu.
- Setiap kali berhenti di tengah fitur, catat di `claude-progress.md`: **sub-langkah mana yang sudah kelar, mana yang berikutnya** — biar sesi baru bisa langsung lanjut.

## Definition of Done

Sebuah fitur boleh ditandai `passing` di `feature_list.json` kalau:

1. Perilaku sesuai `user_visible_behavior` dan acceptance criteria terkait di `PRD-RAKIT.md`.
2. Langkah-langkah di `verification` sudah dijalankan manual dan lolos, bukti dicatat di field `evidence`.
3. `claude-progress.md` diupdate dengan session record baru (goal, completed, verification run, commits, next best action).
4. Baseline gak rusak — `VERIFY_CMD` di `init.sh` tetap lolos setelah perubahan.

## End of Session

- Update `claude-progress.md` — Current Verified State + Session Record.
- Pastikan `feature_list.json` cuma punya satu entry `in_progress` (atau nol kalau lagi nunggu instruksi user).
- Jangan tinggalkan kerjaan setengah jadi tanpa dicatat di `Known risks` / `Next best action`.

---

Catatan: file ini living doc, update kalau ada aturan kerja baru yang disepakati bareng user.

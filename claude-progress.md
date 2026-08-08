# claude-progress.md â€” Rakit

Log progress project. Baca bagian **Current Verified State** di awal tiap sesi. Update bagian ini + tambah **Session Record** baru di akhir tiap sesi.

---

## Current Verified State

- **Repository root directory:** `D:\PROJECT VIBECODERS\RAKIT-V2.0.0` (mesin Windows asli, bukan sandbox lagi).
- **Standard startup path:** `./init.sh` (jalankan lewat Git Bash)
- **Standard verification path:** `npm run build` â€” **SUDAH LOLOS** di mesin Windows (Sesi 2).
- **Prasyarat mesin dev â€” SUDAH TERKONFIRMASI LENGKAP (Sesi 2):** Rust 1.97.1, MSVC Build Tools 2026, WebView2 Runtime 150.0.4078.105.
- **`npm run tauri dev` SUDAH PERNAH JALAN (Sesi 2):** compile Rust pertama 2m 15s, `app.exe` kebuka, dev server Vite di port 1420 sehat.
- **Highest priority unfinished feature:** `invoice-generate-export` (priority 15, `in_progress`). Finance dan Invoice telah disinkronkan pada level kode; verifikasi manual runtime masih diperlukan.
- **Current blocker:** Tidak ada blocker teknis.
- **Catatan verifikasi sesi terbaru:** `npm run build` lulus pada 2026-08-08 di lingkungan Windows penuh (3139 modul). Sandbox biasa tetap dapat memblokir binary native Tailwind dengan `spawn EPERM`.

**Environment dev:**

- Windows 11 Pro for Workstations 64-bit (Build 26200)
- Intel Core i5-12450H, 16GB RAM, MSI Thin GF63 12UC
- Rust 1.97.1 âœ…, MSVC Build Tools 2026 âœ…, WebView2 150.0 âœ…

**Fase roadmap saat ini:** Fase 1 â€” Project (folder otomatis)

---

## Session Record

### Sesi 2 â€” Verifikasi baseline di Windows + App Shell jadi (2026-08-05)

- **Goal:** Jalankan verifikasi baseline pertama kali di mesin Windows asli, lalu selesaikan App Shell (sidebar + routing + 7 halaman placeholder).
- **Completed:**
  - Prasyarat terkonfirmasi: Rust 1.97.1, MSVC Build Tools 2026, WebView2 Runtime 150.0.4078.105 â€” semua sudah terpasang.
  - `npm install` sukses (131 packages; 2 high severity vuln sudah diketahui â€” soal SSR/RSC yang tidak dipakai SPA Tauri, aman diabaikan).
  - Fix baseline gagal: TypeScript 6.0 deprecate `baseUrl` â€” dihapus dari `tsconfig.json` & `tsconfig.app.json` (di TS6 `paths` tidak butuh `baseUrl`, pakai path relatif `./src/*`).
  - Fix warning Vite: `__dirname` â†’ `import.meta.dirname` di `vite.config.ts`.
  - Tambah script `"tauri": "tauri"` di `package.json` (sebelumnya missing, `npm run tauri dev` gagal).
  - `npm run build` LOLOS bersih tanpa warning.
  - `npm run tauri dev` PERTAMA KALI JALAN: compile Rust 2m 15s, `app.exe` kebuka, Vite dev server port 1420 HTTP 200.
  - `src/components/app-sidebar.tsx` ditulis â€” versi Rakit (branding "Rakit" + NavMain flat 7 menu, tanpa TeamSwitcher/NavUser/NavProjects).
  - `src/components/placeholder-page.tsx` dibuat â€” komponen placeholder bersama.
  - 7 halaman placeholder dibuat di `src/pages/`: dashboard, project, finance, idea, reference, archive, settings.
  - `src/App.tsx` di-rewrite total: HashRouter (aman untuk Tauri production build) + SidebarProvider + AppSidebar + SidebarInset + header breadcrumb dinamis + Routes 7 halaman. `src/App.css` template Vite dihapus.
  - Build ulang setelah wiring: LOLOS (1915 modul).
- **Verification run:** `npm run build` âœ… lolos bersih. `npm run tauri dev` âœ… app.exe jalan, dev server HTTP 200. Verifikasi visual klik 7 menu: menunggu konfirmasi user.
- **Evidence recorded:** Output terminal build & tauri dev di sesi ini.
- **Commits:** Belum ada repo git â€” disarankan `git init` + commit pertama segera.
- **Known risks:**
  - HMR sempat error sesaat saat App.tsx/App.css dihapus di tengah dev server jalan â€” resolved sendiri via page reload, tapi kalau window user masih tampil template Vite lama, restart `npm run tauri dev`.
  - `tauri build` (production) belum pernah dicoba â€” bagian dari verification `fondasi-setup-tauri`.
- **Next best action:**
  1. User konfirmasi visual: sidebar 7 menu tampil, klik tiap menu pindah halaman tanpa error.
  2. Kalau OK â†’ tandai `fondasi-setup-tauri` & `fondasi-setup-shadcn-shell` sebagai `passing` di `feature_list.json` (isi field `evidence`).
  3. Opsional tapi disarankan: `git init` + commit pertama.
  4. Lanjut `fondasi-setup-sqlite` (priority 3): install tauri-plugin-sql, buat schema awal sesuai PRD section 5.

### Sesi 0 â€” Perencanaan (belum ada kode)

- **Goal:** Susun ulang PRD dari nol, buat `feature_list.json`, `AGENTS.md`, `init.sh`, `claude-progress.md`.
- **Completed:**
  - `PRD-RAKIT.md` ditulis ulang total â€” konsep baru: Dashboard, Project, Finance, Idea, Reference, Archive, Settings. Stack diputuskan: Tauri + React + TypeScript + SQLite + dnd-kit + shadcn/ui (`sidebar-07`).
  - `feature_list.json` dibuat â€” 27 fitur, priority 1-27, mengikuti 10 fase roadmap di PRD.
  - `AGENTS.md` dibuat â€” aturan kerja agent, termasuk catatan environment Windows.
  - `init.sh` dibuat â€” `INSTALL_CMD=npm install`, `VERIFY_CMD=npm run build`, `START_CMD=npm run tauri dev`.
- **Verification run:** Tidak ada â€” belum ada kode, baru dokumen perencanaan.
- **Evidence recorded:** N/A.
- **Commits:** Belum ada repo git.
- **Known risks:**
  - `settings-identitas-agency` (fase 9) kemungkinan overlap sama `invoice-pengaturan` (fase 4) â€” cek dulu saat sampai di sana, jangan kerjakan dobel.
  - Rust toolchain, MS C++ Build Tools, WebView2 belum dikonfirmasi terpasang di mesin dev â€” bisa jadi blocker pertama begitu masuk Fase 0.
  - Path folder utama (untuk auto-create folder project) belum ada default â€” perlu diputuskan/diinput user sebelum `project-folder-otomatis` (priority 5) dikerjakan, atau pakai default sementara.
- **Next best action:** Mulai Fase 0 â€” init project Tauri (`fondasi-setup-tauri`, priority 1). Sebelum itu, verifikasi dulu Rust + C++ Build Tools + WebView2 sudah terpasang di mesin dev.

### Sesi 1 â€” Mulai coding Fase 0 (Fondasi)

- **Goal:** Mulai `fondasi-setup-tauri` dan `fondasi-setup-shadcn-shell`.
- **Completed:**
  - Scaffold Vite + React + TypeScript, `npx tauri init` sukses (src-tauri lengkap: Cargo.toml, main.rs, lib.rs, tauri.conf.json, capabilities/default.json).
  - `tauri.conf.json`: identifier `com.rakit.app`, window 1440x900 (min 1024x700).
  - `vite.config.ts`: port fix 1420 strictPort, alias `@` â†’ `src`, watch ignore `src-tauri`.
  - `tsconfig.json` & `tsconfig.app.json`: alias `@/*` ditambahkan.
  - Tailwind v4 + token warna shadcn/ui (light+dark) di `src/index.css`, termasuk token custom `--success`/`--warning` buat status pembayaran project.
  - `components.json` dibuat manual, `lib/utils.ts` (cn helper) dibuat.
  - Komponen shadcn/ui (`sidebar`, `button`, `separator`, `breadcrumb`, `sheet`, `tooltip`, `skeleton`, `input`, `avatar`, `dropdown-menu`, `collapsible`) + `hooks/use-mobile.ts` â€” **ditarik dari source resmi GitHub** (`raw.githubusercontent.com/shadcn-ui/ui`), bukan registry `ui.shadcn.com` (domain itu diblokir jaringan sandbox kerja, tapi raw.githubusercontent.com tetap bisa diakses).
  - `nav-main.tsx` custom ditulis â€” menu flat 7 item (bukan struktur nested/team-switcher dari block asli), pakai React Router `Link` + `useLocation` buat active state.
  - `react-router-dom@7.18.2` terinstall.
- **Verification run:** **BELUM ADA.** Kerja dilakukan di sandbox Linux tanpa GUI/Rust build tools â€” belum sempat `npm install` ulang dari nol atau `npm run build` buat cek TypeScript valid. Ini prioritas nomor satu di sesi berikutnya.
- **Evidence recorded:** N/A â€” lihat field `notes` di `feature_list.json` untuk detail sub-langkah per fitur.
- **Commits:** Belum ada repo git di project ini.
- **Known risks:**
  - Registry `ui.shadcn.com` mungkin diblokir tergantung environment kerja â€” kalau `npx shadcn@latest add` gagal dengan "not authorized", pakai fallback ambil source dari `raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/...` (masih source resmi).
  - `app-sidebar.tsx` versi Rakit **belum ditulis** â€” file asli dari block masih demo data (team switcher, nav user, nav projects) yang gak relevan buat Rakit (belum ada login/multi-team).
  - `App.tsx` belum di-wire ke `SidebarProvider` + routes React Router.
  - 7 halaman placeholder (Dashboard/Project/Finance/Idea/Reference/Archive/Settings) belum dibuat sama sekali.
  - Plugin SQLite (Tauri SQL plugin) belum disentuh â€” itu scope `fondasi-setup-sqlite` (priority 3), belum dimulai.
  - Rust toolchain, MS C++ Build Tools, WebView2 di mesin Windows asli belum dikonfirmasi terpasang.
- **Next best action:**
  1. Extract project, buka folder di Windows, cek Rust + C++ Build Tools + WebView2 terpasang.
  2. Jalankan `npm install`, lalu `npm run build` â€” pastikan gak ada error TypeScript dari komponen yang sudah ditarik.
  3. Coba `npm run tauri dev` â€” pastikan window kebuka (verifikasi pertama kalinya app ini benar-benar jalan).
  4. Baru lanjut: tulis `app-sidebar.tsx` versi Rakit, wire `App.tsx` + routes, buat 7 halaman placeholder â€” baru tandai `fondasi-setup-shadcn-shell` sebagai `passing`.

### Sesi 4 â€” CRUD Project + folder otomatis (2026-08-05)

- **Goal:** Menuntaskan CRUD dasar Project, lalu mulai folder project otomatis.
- **Completed:**
  - CRUD Project ditandai `passing`: user mengonfirmasi tambah, edit, dan hapus lewat UI sudah bekerja. Permission `sql:allow-execute` ditambahkan untuk operasi tulis.
  - Plugin resmi `@tauri-apps/plugin-fs` dan `tauri-plugin-fs` dipasang dan diregistrasikan.
  - Saat project baru disimpan, app kini membuat folder fisik memakai API filesystem Tauri resmi di `D:\#0 JOBS\RAKIT-V2.0.0` dengan format `RKT-XXX-nama-klien-tanggal`.
  - Nomor urut folder mengambil urutan SQLite AUTOINCREMENT, sehingga nomor yang pernah digunakan tidak dipakai ulang setelah project terakhir dihapus.
  - Path folder fisik disimpan di kolom `projects.folder_path` yang sudah ada pada schema PRD.
  - Capability filesystem dibatasi hanya untuk `D:\#0 JOBS\RAKIT-V2.0.0/**/*` dan `mkdir`; tidak memberi akses drive D secara luas.
- **Verification run:** `npm run build` âœ…; `cargo check --manifest-path src-tauri/Cargo.toml` âœ…. Tauri dev mendeteksi perubahan capability dan menjalankan ulang `app.exe`.
- **Evidence recorded:** Output build dan cargo check sesi ini. Verifikasi folder fisik masih menunggu uji manual lewat form tambah project.
- **Commits:** Belum ada repo git.
- **Known risks:** Settings folder utama belum dibuat (priority 23); lokasi sementara yang dipilih user adalah `D:\#0 JOBS\RAKIT-V2.0.0`. Perubahan lokasi melalui UI dikerjakan saat fitur Settings.
- **Next best action:** Tambah satu project melalui app dan pastikan folder muncul di D:\#0 JOBS\RAKIT-V2.0.0. Setelah user mengonfirmasi, tandai `project-folder-otomatis` sebagai passing lalu lanjut `project-buka-folder-lokal` (priority 6).
### Sesi 3 — SQLite foundation (2026-08-05)

- **Goal:** Selesaikan fitur SQLite dan schema awal.
- **Completed:** Plugin resmi `tauri-plugin-sql` dengan driver SQLite dikonfigurasi; migration `0001_initial_schema.sql` dibuat untuk projects, transactions, invoices, ideas, reference_items, dan settings; permission `sql:default` ditambahkan; React menjalankan query `SELECT 1` saat start sebagai pemeriksaan koneksi.
- **Verification run:** `npm run build` dan `cargo check` lulus. Runtime `tauri dev` memuat ulang tanpa error setelah query uji dan migration diperbaiki.
- **Evidence recorded:** Field evidence `fondasi-setup-sqlite` di feature_list.json.
- **Commits:** Belum ada repo git.
- **Known risks:** Database belum memiliki UI CRUD; tabel fisik `reference_items` dipakai karena `references` adalah kata kunci SQLite. Keputusan desain tersimpan: popup putih saat tema gelap dan hitam saat tema terang; diterapkan pada fitur settings-tema-dark-light.
- **Next best action:** Mulai `project-crud-dasar` (priority 4): bentuk repository/data access Project, form tambah/edit, lalu daftar project.
---

<!-- Template entri sesi berikutnya, copy-paste ke atas ini tiap sesi baru:

### Sesi N â€” <tanggal/topik singkat>

- **Goal:**
- **Completed:**
- **Verification run:**
- **Evidence recorded:**
- **Commits:**
- **Known risks:**
- **Next best action:**

-->

### Sesi 5 - Tombol buka folder lokal (2026-08-05)

- User mengonfirmasi folder otomatis di D:\#0 JOBS\RAKIT-V2.0.0; fitur folder otomatis passing.
- Tombol Folder pada kolom Aksi membuka folder project melalui plugin resmi Tauri opener.
- npm run build dan cargo check lulus; klik File Explorer masih menunggu uji manual.

### Sesi 6 - Verifikasi buka folder lokal (2026-08-06)

- User mengonfirmasi ikon Folder berhasil membuka folder project yang tepat di File Explorer.
- Scope plugin opener ditambahkan secara khusus untuk D:\#0 JOBS\RAKIT-V2.0.0/**/* setelah log runtime menunjukkan penolakan path.
- project-buka-folder-lokal ditandai passing. Fitur aktif berikutnya: project-view-list-table (priority 7).

### Sesi 7 - Mode List dan Table Project (2026-08-06)

- Komponen shadcn Toggle Group dan Card ditambahkan lewat CLI resmi.
- Halaman Project memiliki pemilih List/Table. Kedua mode memakai data dan aksi CRUD yang sama.
- npm run build lulus. Verifikasi visual dan perpindahan mode menunggu uji manual.

### Sesi 8 - Kanban Project (2026-08-06)

- dnd-kit core, sortable, dan utilities dipasang sesuai PRD.
- Mode Kanban menampilkan lima kolom tetap. Drop kartu memanggil updateProjectStatus lalu memuat ulang data SQLite.
- npm run build lulus. Uji drag, refresh, dan persistensi status menunggu verifikasi manual.

### Sesi 9 - Verifikasi Kanban (2026-08-06)

- User mengonfirmasi Kanban aman setelah drag dan refresh.
- Layout desktop Kanban diperbaiki menjadi lima kolom grid tanpa scroll horizontal.
- project-view-kanban ditandai passing. Fitur berikutnya: project-view-kalender (priority 9).

### Sesi 10 - Calendar verified and payment status started (2026-08-06)

- Calendar date matching now uses the local date, avoiding UTC day shifts.
- User confirmed Calendar works. `project-view-kalender` is passing.
- `project-status-pembayaran-wa` is now the only active feature.
- Baseline: `npm run build` passed.
- Next: show payment status consistently, add WhatsApp action, and mark overdue projects with an icon.
### Sesi 11 - Payment status and WhatsApp action (2026-08-06)

- Added shared payment label and overdue-date helpers.
- List, Table, Kanban, and Calendar now show payment state consistently.
- Overdue active projects show a warning icon or badge.
- List and Table actions now include a WhatsApp action. Indonesian numbers beginning with 0 are converted to 62 for wa.me.
- Baseline: `npm run build` passed.
- Manual verification still needed: payment badge update, WhatsApp opens correct chat, and overdue marker is visible.
### Sesi 12 - Payment status feature completed (2026-08-06)

- Payment status, overdue marker, and WhatsApp actions are available across Project views.
- `project-status-pembayaran-wa` is passing. `finance-pemasukan-termin` is now active.
- Baseline: `npm run build` passed.
### Sesi 13 - Project income flow complete (2026-08-06)

- Finance income is opened only from a Project and saves DP and Lunas entries for that project.
- inance-pemasukan-termin is passing. inance-pengeluaran is active.
- Baseline: npm run build passed.

### Sesi 14 - Popup Pengaturan Invoice (2026-08-06)

- Pengaturan Invoice dipindahkan dari kartu halaman menjadi ikon roda gigi di kanan atas halaman Invoice.
- Ikon membuka popup terpusat berisi nama agency, prefix, alamat, telepon, email, instruksi pembayaran, penandatangan, dan pemilih logo.
- Semua field pengaturan tersebut sekarang disimpan ke SQLite dan dimuat kembali saat halaman dibuka.
- Baseline: `npm run build` lulus.
- Next best action: lanjutkan template invoice lengkap dan ekspor dokumen pada `invoice-generate-export`.

### Sesi 15 - Layout dua kolom dan ekspor Invoice (2026-08-06)

- Halaman Invoice kini terbagi dua: panel kiri memilih project dan menjalankan satu tombol Generate Invoice; panel kanan menampilkan preview dokumen invoice.
- Setelah invoice dibuat, preview memuat identitas agency, klien, daftar pemasukan, total, instruksi pembayaran, dan penandatangan.
- Tombol Download PDF dan Download PNG tersedia di bawah preview. Keduanya menangkap preview yang sama agar hasil unduhan sesuai tampilan.
- Baseline: `npm run build` lulus. Peringatan ukuran bundle Vite masih ada, tanpa error build.
- Next best action: uji manual Generate serta unduhan PDF/PNG di aplikasi Tauri, lalu rapikan template bila diperlukan.

### Sesi 16 - Lengkapi ekspor Invoice (2026-08-06)

- Menambahkan ekspor JPG selain PNG dan PDF; format terakhir kini disimpan ke kolom `invoices.last_export_format`.
- Build produksi lulus dengan `npm run build` di luar sandbox; sandbox biasa masih tidak dapat memuat binary native Tailwind/Vite.
- Fitur `invoice-generate-export` tetap `in_progress` sampai ekspor diuji manual di aplikasi Tauri.
- Next best action: buat invoice dari project yang memiliki pemasukan, lalu verifikasi file PNG, JPG, dan PDF serta nomor invoice.

### Sesi 17 - Preview logo Invoice (2026-08-06)

- Dengan izin eksplisit user, asset protocol Tauri diaktifkan terbatas untuk Pictures, Desktop, Documents, dan Downloads.
- Logo yang dipilih pada Pengaturan Invoice sekarang dirender di preview invoice melalui `convertFileSrc`.
- `npm run build` dan `cargo check --manifest-path src-tauri/Cargo.toml` lulus.
- Fitur `invoice-generate-export` tetap `in_progress` sampai Generate, logo, dan unduhan PNG/JPG/PDF diuji manual di aplikasi Tauri.

### Sesi 18 - Verifikasi logo Invoice (2026-08-06)

- User mengonfirmasi logo yang dipilih sudah tampil pada preview invoice.

### Sesi 19 - Runtime Invoice dibuka (2026-08-06)

- Aplikasi Tauri dijalankan untuk uji invoice, tetapi otomasi UI Windows gagal karena host menolak spawn proses kontrol (`EPERM`).
- `invoice-generate-export` tetap menunggu verifikasi manual Generate dan unduhan PNG/JPG/PDF.

### Sesi 20 - Perbaikan ekspor Invoice native (2026-08-06)

- Ekspor PNG/JPG/PDF tidak lagi memakai tautan unduhan browser; sekarang memakai dialog Save As dan `writeFile` Tauri.
- Capability `dialog:allow-save` dan `fs:allow-write-file` ditambahkan. Path yang dipilih dialog diberi scope sementara oleh Tauri.
- UI menampilkan pesan berhasil/gagal Generate dan ekspor, bukan hanya mengirim error ke console.
- `npm run build` dan `cargo check --manifest-path src-tauri/Cargo.toml` lulus.

### Sesi 21 - Perbaikan alur klik Invoice (2026-08-06)

- Tombol Generate Invoice tidak lagi dikunci saat project belum dipilih; kini menampilkan pesan panduan yang jelas, termasuk saat belum ada project.
- Tombol ekspor tetap hanya muncul setelah invoice berhasil dibuat.
- `npm run build` lulus.

### Sesi 22 - Perbaikan renderer ekspor Invoice (2026-08-06)

- Bukti runtime menunjukkan `html2canvas` gagal mem-parsing warna `oklch` dari token Tailwind v4.
- Salinan preview untuk ekspor kini dinormalisasi ke warna RGB di callback `onclone`, tanpa mengubah tampilan aplikasi.
- `npm run build` lulus.

### Sesi 23 - Scope logo dan renderer ekspor (2026-08-06)

- Asset protocol kini juga mencakup folder project `D:/#0 JOBS/RAKIT-V2.0.0/**/*` agar logo lokal di sana dapat tampil setelah restart.
- Normalisasi warna RGB untuk html2canvas diperluas ke seluruh dokumen hasil kloning.
- `npm run build` dan `cargo check --manifest-path src-tauri/Cargo.toml` lulus.

### Sesi 24 - Lokasi ekspor Invoice (2026-08-06)

- PNG, JPG, dan PDF kini otomatis disimpan ke folder fisik project yang dipilih; dialog Save As hanya fallback untuk project tanpa folder.
- `npm run build` lulus.

### Sesi 25 - Invoice selesai, mulai Idea (2026-08-07)

- User mengonfirmasi ekspor invoice PDF berhasil dan logo ikut masuk; ukuran logo diseragamkan.
- invoice-generate-export ditandai passing. idea-crud adalah satu-satunya fitur aktif.
- Baseline: npm run build lulus.
- Next: buat repository SQLite Idea, form empat tipe konten, lalu daftar/edit/hapus.


### Sesi 26 - Mulai CRUD Idea (2026-08-07)

- **Goal:** Lanjutkan fitur aktif setelah Invoice, yaitu CRUD Idea untuk teks, dokumen, gambar, dan link.
- **Completed:**
  - Status `invoice-generate-export` diselaraskan menjadi `passing` sesuai konfirmasi ekspor PDF/logo; `idea-crud` menjadi satu-satunya fitur `in_progress`.
  - Menambahkan `src/features/idea/idea-repository.ts` untuk list, simpan/tambah, edit, dan hapus data dari tabel SQLite `ideas`.
  - Mengganti halaman placeholder Idea dengan daftar kartu, empty state, form Sheet tambah/edit, dan konfirmasi hapus.
  - Form mendukung tipe teks, dokumen, gambar, dan link; dokumen/gambar memakai dialog pemilih file dan menyimpan path lokal, sedangkan link divalidasi sebagai URL HTTP(S). Kategori sementara memakai preset sesuai scope sebelum fitur kategori custom.
- **Verification run:** `npm install` lulus. `npm run build` lulus di lingkungan Windows penuh; sandbox biasa memblokir binary native Tailwind/Vite dengan `spawn EPERM`.
- **Evidence recorded:** Output build sesi ini: TypeScript dan Vite sukses mentransformasi 3136 modul.
- **Commits:** Belum ada repo git.
- **Known risks:** CRUD Idea belum diuji interaktif di runtime Tauri. File terpilih hanya direferensikan melalui path lokal, tidak disalin, sesuai field `isi/path file` pada PRD.
- **Next best action:** Jalankan `npm run tauri dev`, uji tambah satu Idea dari masing-masing empat tipe, lalu edit dan hapus satu item. Jika semua aman, tandai `idea-crud` passing dan lanjut `idea-kategori`.
### Sesi 27 - Sinkronisasi Pesanan, Transaksi, dan Invoice (2026-08-07)

- **Goal:** Memperbaiki laporan bahwa Finance tidak menyediakan pencatatan transaksi/pesanan yang tersinkron dengan Invoice.
- **Completed:**
  - Mengembalikan `invoice-generate-export` sebagai satu-satunya fitur aktif; `idea-crud` ditunda.
  - Finance kini mempunyai aksi **Catat Transaksi** untuk pemasukan maupun pengeluaran. Form wajib memilih Project dan Pesanan, lalu menyimpan termin (untuk pemasukan), nominal, tanggal, dan catatan.
  - Finance menyediakan **Kelola Pesanan** untuk menambah pesanan dan item bernilai; riwayat transaksi kini menampilkan Project dan Pesanan yang terkait.
  - Query transaksi dan simpan pengeluaran diperbaiki agar membaca/menulis `transactions.order_id` serta menampilkan nama pesanan.
  - Invoice/Nota kini wajib memilih Project lalu satu Pesanan. Hanya item dari pesanan itu yang masuk preview, dan `invoices.order_id` disimpan saat dokumen dibuat.
- **Verification run:** `npm run build` lulus setelah perbaikan (3136 modul). Peringatan ukuran bundle Vite tetap ada tanpa error.
- **Known risks:** Alur baru belum diuji manual dalam aplikasi Tauri. Nota masih menggunakan nilai item pesanan sebagai total dokumen; jika Nota harus merepresentasikan satu pembayaran tertentu (bukan total pesanan), itu perlu diputuskan/ditambahkan pada iterasi berikutnya.
- **Next best action:** Di runtime Tauri: buat pesanan → catat DP/pelunasan dengan pesanan itu → pastikan riwayat menampilkan pesanan → generate Invoice/Nota dari pesanan tersebut → uji ekspor PDF/PNG/JPG.
### Sesi 12 — Sinkronisasi Pesanan ke Pemasukan + rilis updater (2026-08-07)

- **Goal:** Nominal setiap pesanan harus langsung tercatat di Riwayat Pemasukan, lalu disalurkan ke aplikasi terpasang lewat updater.
- **Completed:** Menambahkan transaksi pemasukan bertaut `order_id` saat pesanan dibuat, memperbarui nominalnya jika pesanan diedit, dan menghapusnya ketika pesanan dihapus. Pesanan lama ikut tersinkron saat halaman Keuangan dibuka. Rilis publik `v0.1.2` dibuat, installer NSIS ditandatangani, serta `latest.json` publik diperbarui.
- **Verification run:** `npm run build` lulus; `cargo check --manifest-path src-tauri/Cargo.toml` lulus; installer EXE dan MSI 0.1.2 berhasil dibuat; URL manifest publik mengembalikan versi 0.1.2.
- **Commits:** `96bfb27 fix: sync order amounts to income history`.
- **Known risks:** Verifikasi UI akhir menunggu user: buka Keuangan setelah update dan pastikan pesanan lama maupun baru tampil satu kali di Riwayat Pemasukan.
- **Next best action:** User memasang update 0.1.2 dan menguji satu pesanan baru serta satu pesanan lama pada halaman Keuangan.

### Sesi 28 - Perbaikan hapus pesanan terkait invoice (2026-08-08)

- **Goal:** Memperbaiki pesanan pada popup Tambah Pesanan yang tidak dapat dihapus.
- **Completed:** Sebelum menghapus pesanan, relasi `invoices.order_id` kini dilepas (`NULL`). Snapshot item pada invoice tetap tersimpan di `items_json`, sehingga riwayat dokumen tidak hilang tetapi foreign key tidak lagi memblokir penghapusan pesanan. Popup juga menampilkan hasil sukses atau gagal, menggantikan kegagalan yang sebelumnya hanya masuk console.
- **Verification run:** `npm install`, `npx tsc -b`, dan `npm run build` lulus. Build produksi memproses 3139 modul; hanya ada peringatan bundle utama di atas 500 kB.
- **Commits:** Belum ada commit baru.
- **Known risks:** Perlu satu uji manual di aplikasi Tauri pada pesanan yang pernah dibuatkan invoice/nota untuk mengonfirmasi item hilang dari daftar dan dokumen lamanya tetap ada.
- **Next best action:** Uji hapus `Spanduk 3x1 Meter` dari popup Tambah Pesanan.

### Sesi 29 - Persiapan updater 0.1.3 (2026-08-08)

- **Goal:** Menyiapkan update aplikasi berisi perbaikan penghapusan pesanan.
- **Completed:** Versi `0.1.3` telah diselaraskan di package, konfigurasi Tauri, dan Cargo. `npm run build` serta `cargo check --manifest-path src-tauri/Cargo.toml` lulus. Installer lokal `Rakit_0.1.3_x64-setup.exe` berhasil dibuat.
- **Verification run:** Build frontend memproses 3139 modul tanpa error; cargo check selesai untuk `app v0.1.3`.
- **Known risks:** Kunci `TAURI_SIGNING_PRIVATE_KEY` tidak tersedia di environment, sehingga file signature `.sig` untuk installer 0.1.3 belum dibuat. GitHub CLI juga tidak dapat membuat release karena token akun `jprint144` sudah tidak valid. Update belum dapat dipublikasikan ke updater sampai dua akses ini dipulihkan.
- **Next best action:** Sediakan kunci signing updater yang sama seperti rilis sebelumnya dan autentikasi ulang GitHub CLI, kemudian build ulang, unggah installer/signature/latest.json, dan publish release `v0.1.3`.

### Sesi 30 - Invoice dan Nota gabungan per project (2026-08-08)

- **Goal:** Mengubah Invoice dan Nota agar memuat seluruh pesanan dari satu project tanpa pemilihan pesanan individual.
- **Completed:** Pemilih pesanan dihapus. Saat Project dipilih, seluruh `order_items` dari semua pesanan dalam project dimuat ke preview, dihitung sebagai satu total, dan disimpan pada invoice baru dengan `order_id` kosong. Dokumen tidak bisa dibuat untuk project tanpa pesanan. Mengganti tipe Invoice/Nota juga mengosongkan preview lama agar label dokumen tidak tertukar.
- **Verification run:** `npm run build` lulus (3139 modul); peringatan ukuran bundle utama di atas 500 kB tetap ada tanpa error.
- **Known risks:** Perubahan belum diuji manual di aplikasi Tauri dengan project yang memiliki lebih dari satu pesanan.
- **Next best action:** Pilih project dengan minimal dua pesanan, lalu generate Invoice dan Nota untuk memastikan seluruh item serta total tampil pada keduanya.

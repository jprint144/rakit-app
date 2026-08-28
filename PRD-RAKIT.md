# PRD: Rakit

**Rapikan · Atur · Kembangkan · Ide · Terbitkan**

Aplikasi desktop personal untuk desainer grafis, satu ruang kerja dari ide mentah sampai project terbayar.

---

## 1. Ringkasan Eksekutif

**Problem Statement:** Sebagai desainer grafis, sering kesulitan brainstorming ide begitu dapat project baru, progress project susah dilacak, untung-rugi tiap project gak jelas, ide numpuk gak keurus, dan referensi visual tersebar di banyak tab browser yang campur aduk sama urusan pribadi.

**Proposed Solution:** Rakit menyatukan kebutuhan tracking project, keuangan, idea vault, dan reference browser dalam satu aplikasi offline, lokal sepenuhnya, di desktop dan Android. Jadi gak perlu lompat-lompat antar tools buat urusan yang sebenarnya saling terkait.

**Success Criteria:**
- Semua project aktif punya catatan pemasukan-pengeluaran yang match 1:1 dengan kondisi rekening/tunai asli — gak ada lagi tebak-tebak untung-rugi.
- Idea vault jadi satu-satunya tempat nyimpen ide, gak ada lagi ide yang "lupa disimpan di mana".
- Reference browser gantiin kebiasaan buka tab Chrome buat riset visual pas kerja.
- Folder project rapi otomatis — setiap project baru langsung punya folder sendiri di dalam folder utama, dengan kode yang konsisten.
- App 100% jalan offline (gak ada dependency internet sama sekali di versi ini).

## 2. Target Users

Dirinya sendiri, desainer grafis merangkap developer aplikasi ini. Personal use, belum untuk publik. Login/akun sengaja **belum** ada di versi ini — direncanakan upgrade bertahap nanti (lihat Non-Goals).

## 3. Struktur Halaman & Fitur Utama

Navigasi sidebar (base komponen: shadcn/ui block `sidebar-07`), 8 halaman:

1. **Dashboard** — ringkasan semua project (status, overdue, klien, keuangan) dalam satu layar.
2. **Project** — daftar & tracking semua project aktif. 4 tampilan: List, Table, Kanban, Kalender.
3. **Finance** — keuangan per project (pemasukan per termin + pengeluaran), status untung/rugi, invoice & nota.
4. **Idea** — idea vault, khusus nyimpen ide (teks, dokumen, gambar, link), dikelompokkan per kategori.
5. **Reference** — browser in-app buat buka referensi desain, link dikelompokkan per kategori, ditambah manual.
6. **Archive** — project yang sudah selesai dipindah ke sini biar gak numpuk di daftar utama; folder fisiknya juga dipindah ke folder Arsip di dalam folder utama.
7. **Settings** — pengaturan aplikasi: folder utama, identitas agency (nama, logo) buat invoice/nota, kategori custom (Idea/Reference), tema (dark/light).
8. **Tugas Harian** — catatan tugas pribadi yang berdiri sendiri, tidak terhubung ke Project, dengan jadwal dan pengingat.
9. **Habit Tracker** — tracker custom bulanan untuk kebiasaan, target angka, dan rutinitas pribadi.

## 4. User Stories & Acceptance Criteria

### Project

Sebagai desainer, mau lacak semua project dengan fleksibel — kadang mau lihat daftar cepat, kadang mau lihat alur kerja per tahap, kadang mau lihat berdasarkan deadline.

- **AC:** Project bisa ditampilkan dalam 4 mode — List, Table, Kanban, Kalender — data tetap sinkron di semua mode, ganti tampilan tanpa loading yang kelihatan.
- **AC:** Kolom Kanban: **Brief → Konsep → Revisi → Finalisasi → Selesai**.
- **AC:** Tiap project punya: nama, klien, nomor WhatsApp klien (klik langsung buka chat WA), status kanban, status pembayaran (**Belum Lunas / DP / Lunas**), deadline, brief/deskripsi.
- **AC:** Tiap project memiliki tombol **Brief** yang langsung membuka file `brief.txt` tetap di folder project dengan aplikasi Notepad Windows. Setiap project selalu memakai file yang sama saat dibuka ulang; file dibuat saat pertama kali dibuka. Brief lama yang tersimpan di aplikasi dipindahkan sebagai teks ke file tersebut tanpa menghapusnya.
- **AC:** Klik "Tambah Project" otomatis bikin folder baru di dalam folder utama, dengan kode folder format `RKT-001-namaklien-tanggal` (nomor urut naik otomatis).
- **AC:** Dari halaman Project Detail, ada tombol buka folder lokal project langsung ke file explorer OS.
- **AC:** Due date yang lewat ditandai visual beda (bukan cuma warna, ada ikon) di semua tampilan.
- **AC:** Project yang ditandai "Selesai" bisa dipindah ke Archive (lihat section Archive).

### Finance

Sebagai desainer, mau catat pemasukan per termin dan pengeluaran tiap project biar tahu untung-rugi, dan bisa langsung bikin invoice/nota dari situ.

- **AC:** Pemasukan dicatat per termin (DP, pelunasan, dst) dengan nominal dan tanggal masing-masing.
- **AC:** Pengeluaran dicatat per project dengan nominal, tanggal, catatan.
- **AC:** Owner mencatat pengeluaran dari popup Finance setelah Invoice dan Nota project dibuat. Popup hanya menampilkan project yang memiliki pesanan serta kedua dokumen tersebut.
- **AC:** Ringkasan untung/rugi kehitung otomatis begitu ada transaksi baru — gak perlu tombol "hitung ulang".
- **AC:** Finance menampilkan hasil riil per project: omset dari seluruh pesanan, total pengeluaran, dan margin (omset dikurangi pengeluaran).
- **AC:** Ada halaman pengaturan invoice/nota (logo agency, nama agency, format penomoran) sebelum generate dokumen pertama.
- **AC:** Invoice & nota di-generate otomatis dari data transaksi yang sudah ada (gak input ulang manual), bisa di-export ke **PNG, JPG, atau PDF**.
- **AC:** Template Invoice/Nota tampil profesional saat preview maupun export: logo agency mempertahankan rasio asli, informasi dokumen mudah dipindai, tabel item dan total tegas, serta blok penutup dapat menampilkan gambar tanda tangan yang menimpa nama penandatangan.
- **AC:** Invoice dan Nota memiliki tujuan yang berbeda secara jelas: Invoice adalah tagihan dan menampilkan rekening tujuan pembayaran serta total tagihan; Nota adalah bukti pelunasan, hanya dapat dibuat untuk project berstatus Lunas, bernomor `NOTA-�`, menampilkan status LUNAS dan total diterima, serta tidak menampilkan rekening tujuan pembayaran.
- **AC:** Setiap project memiliki satu pasangan nomor dokumen yang permanen: Invoice pertama menetapkan nomor `INV-XXX` (atau prefix Invoice dari Settings), Nota memakai urutan `XXX` yang sama dengan prefix `NOTA-XXX`. Generate ulang dokumen pada project yang sama memuat nomor yang telah ada dan tidak membuat nomor baru.
- **AC:** Pengaturan Invoice/Nota dapat menyimpan satu atau beberapa rekening pembayaran (nama bank, nomor rekening, dan atas nama). Semua rekening tersimpan sinkron dan tampil pada blok pembayaran dokumen dengan susunan ringkas.
- **AC:** Pengaturan Invoice/Nota dapat mengunggah gambar tanda tangan. Gambar tersebut disalin ke penyimpanan aplikasi dan dipakai konsisten pada preview serta ekspor; tanda tangan bawaan dipakai bila pengguna belum mengunggah pengganti.

### Idea

Sebagai desainer, mau simpan ide kapan pun kepikiran, dalam bentuk apa pun, tanpa ribet mikir taruh di mana.

- **AC:** Satu Idea dapat memuat kombinasi teks, dokumen, gambar, dan link sekaligus. Setiap bagian bersifat opsional, tetapi minimal satu bagian harus diisi.
- **AC:** Tiap ide masuk satu kategori (kategori awal preset, user bisa tambah kategori baru sendiri lewat Settings).

### Reference

Sebagai desainer, mau riset visual tanpa keluar dari app dan tanpa nyampur sama tab kerjaan lain.

- **AC:** Reference adalah browser beneran di dalam app (bukan cuma daftar link) — buka website sungguhan di dalam Rakit.
- **AC:** Link disimpan manual oleh user, dikelompokkan per kategori.

### Archive

Sebagai desainer, mau daftar project utama tetap bersih dari project yang sudah kelar.

- **AC:** Project berstatus "Selesai" bisa diarsipkan lewat satu aksi.
- **AC:** Saat diarsipkan, folder fisik project dipindah ke sub-folder Arsip di dalam folder utama (bukan dihapus).
- **AC:** Project yang diarsipkan tetap bisa dibuka/dilihat detailnya (read-only atau tetap bisa diedit — diputuskan saat implementasi), tapi gak muncul di daftar Project utama.

### Tugas Harian

Sebagai pengguna, mau mencatat pekerjaan dan urusan harian di luar Project supaya tidak tercampur dengan tracker client.

- **AC:** User bisa menambah, melihat, mengubah, menandai selesai, dan menghapus tugas harian secara mandiri tanpa relasi ke Project.
- **AC:** Setiap tugas memiliki judul, catatan opsional, tanggal, jam opsional, prioritas, kategori, status selesai, serta waktu pengingat opsional.
- **AC:** Daftar tugas dapat difilter berdasarkan tanggal, kategori, prioritas, dan status selesai; tugas pada hari ini ditampilkan lebih dahulu.
- **AC:** Pengingat yang sudah waktunya tampil sebagai notifikasi desktop lokal ketika aplikasi sedang berjalan; tidak membutuhkan internet atau akun.

### Habit Tracker

Sebagai pengguna, mau membuat tracker custom untuk apa saja dan melihat konsistensinya per bulan.

- **AC:** User bisa menambah, melihat, mengubah, dan menghapus tracker custom bulanan.
- **AC:** Tracker memiliki nama, catatan opsional, kategori, warna, tipe tracking (**Checklist / Angka**), target bulanan opsional, tanggal mulai, dan tanggal akhir.
- **AC:** Periode tracker fleksibel: default tanggal akhir adalah satu bulan setelah tanggal mulai, dan user dapat mengubah tanggal akhir secara manual.
- **AC:** Desktop menampilkan grid periode tracker agar banyak tracker mudah dibandingkan dalam satu layar.
- **AC:** Android menampilkan tracker sebagai kartu dengan tanggal horizontal yang mudah digeser dan disentuh.
- **AC:** Klik tanggal pada tipe Checklist menandai selesai/belum; klik tanggal pada tipe Angka membuka input nilai harian.
- **AC:** Ringkasan menampilkan tracker aktif, total selesai bulan ini, streak terbaik, dan konsistensi bulanan.

### Settings

- **AC:** Bisa atur/ganti folder utama tempat semua folder project dibuat.
- **AC:** Bisa atur identitas agency (nama, logo) buat dipakai di invoice/nota.
- **AC:** Bisa tambah/kelola kategori custom untuk Idea dan Reference.
- **AC:** Bisa ganti tema dark/light. Panel popup mengikuti warna latar dan teks normal dari tema aktif agar konsisten dengan halaman aplikasi.
- **AC:** Bisa mengatur warna ikon folder untuk tiap kelompok sidebar (Kelola kerja, Pribadi, Eksplorasi, dan Lainnya); pilihan disimpan dan ikut terbawa oleh sinkronisasi Settings.
- **AC:** Pengaturan akun sinkron dapat mengubah nama tampilan, avatar, dan password. Avatar disimpan pada Supabase Storage per akun agar konsisten di desktop dan Android.
- **AC:** Bisa export data (backup manual) dan import dari file backup.

## 5. Data Model (Entitas Utama)

Gambaran awal, detail kolom lengkap disusun saat implementasi schema:

- **Project** — kode (`RKT-001-namaklien-tanggal`), nama, klien, nomor WA, brief, status kanban, status pembayaran, deadline, tanggal mulai, path folder lokal, archived flag.
- **Transaksi Keuangan** — relasi ke Project, tipe (pemasukan/pengeluaran), termin (kalau pemasukan), nominal, tanggal, catatan.
- **Invoice/Nota** — relasi ke Project, nomor (auto sesuai format Settings), tanggal, item (dari data transaksi), format export terakhir.
- **Idea** — judul, kategori, teks opsional, path dokumen opsional, path gambar opsional, link opsional, tanggal dibuat. Teks Idea dibuka dalam file `text.txt` permanen per Idea melalui Notepad; teks lama dipindahkan saat file pertama kali dibuka.
- **Reference** — url, judul, kategori, tanggal ditambah, urutan tampilan manual.
- **Tugas Harian** — judul, catatan opsional, tanggal tugas, jam opsional, prioritas, kategori, status selesai, waktu pengingat opsional, tanggal dibuat/diperbarui; tidak memiliki relasi ke Project.
- **Habit Tracker** � tracker custom bulanan berisi nama, catatan, kategori, warna, tipe tracking, target bulanan, tanggal mulai, tanggal akhir, serta entri per tanggal berupa status selesai atau nilai angka.
- **Settings** — path folder utama, nama & logo agency, format penomoran invoice/nota, daftar kategori custom (Idea/Reference), tema aktif, dan warna ikon folder sidebar per kelompok.

## 6. Technical Stack

Catatan sinkronisasi akun: Tugas Harian dan Idea memiliki `sync_id` stabil lintas perangkat serta penanda hapus lunak. Data tetap tersimpan lokal terlebih dahulu, lalu disinkronkan ke Supabase per akun; perubahan terakhir menjadi versi yang digunakan bila satu record diubah di dua perangkat. Project, pesanan, transaksi Keuangan, dan dokumen Invoice/Nota disinkronkan dari desktop sebagai snapshot monitor-only ke Android; data ini hanya dibaca di Android dan tetap dikelola penuh dari desktop.

- **Desktop shell:** Tauri (Rust) — dipilih karena jauh lebih ringan dari Electron (installer kecil, RAM rendah), cocok untuk kebutuhan "full desktop, gak boleh berat".
- **Frontend:** React + TypeScript + Vite
- **Database lokal:** SQLite lewat Tauri SQL plugin — lebih tepat dari IndexedDB/Dexie karena app ini full lokal (bukan browser-first) dan butuh integritas data kuat buat catatan keuangan.
- **Routing:** React Router
- **State UI (non-persisten):** Zustand
- **Drag-and-drop:** dnd-kit (Kanban Project)
- **Komponen UI:** shadcn/ui, base layout dari block `sidebar-07`
- **PDF/gambar export:** library client-side (dipilih saat implementasi halaman Finance)
- **Akses file system:** Tauri API (buka folder, buat folder, dialog file)

## 7. Non-Functional Requirements

- **Performa:** app kebuka dari splash sampai Dashboard siap pakai dalam hitungan detik; aksi simpan data (project, transaksi, ide) kerasa instan.
- **Keandalan:** app 100% jalan offline — gak ada fitur yang bergantung ke internet di versi ini.
- **Usability:** langsung kepake tanpa tutorial — bisa bikin project pertama dalam waktu singkat dari pertama buka app.
- **Keamanan data:** karena belum ada login/cloud, satu-satunya proteksi data adalah file lokal itu sendiri — makanya fitur export/import backup manual (Settings) penting ada dari awal.

## 8. Non-Goals (bukan bagian dari PRD ini)

- Login/akun dan cloud sync — sengaja ditunda, direncanakan upgrade bertahap di versi berikutnya.
- Chat AI/brainstorming asisten — dihilangkan dari scope versi ini.
- Reminder/notifikasi otomatis untuk deadline Project — ditunda; pengingat hanya berlaku untuk modul Tugas Harian.
- Multi-user atau kolaborasi tim.
- Sistem langganan publik / model bisnis SaaS.
- Integrasi otomatis ke sumber referensi luar (Pinterest, Behance, dll) — link tetap ditambah manual.
- Versi web dan iOS. Android menjadi platform pendamping desktop, dengan penyesuaian UI responsif dan pengujian akses file per perangkat. Android dipakai untuk memantau seluruh data; perubahan data hanya diizinkan untuk Tugas Harian dan Idea. Desktop tetap menjadi pengelola penuh untuk seluruh domain.

## 9. Roadmap Pengerjaan Bertahap

Karena dikerjakan lintas sesi (pindah-pindah chat/token terbatas), project ini dipecah per fase kecil. Tiap fase = beberapa entri di `feature_list.json`, dikerjakan satu per satu, gak boncos token dalam satu sesi.

1. **Fase 0 — Fondasi:** setup Tauri + React + Vite + TypeScript, setup shadcn/ui, setup SQLite + schema awal, App Shell (`sidebar-07`) kosong dengan 7 menu.
2. **Fase 1 — Project (List & Table):** CRUD project dasar, tampilan List dan Table, buat folder otomatis + kode folder, tombol buka folder lokal.
3. **Fase 2 — Project (Kanban & Kalender):** tampilan Kanban (drag-drop dnd-kit), tampilan Kalender, status pembayaran, klik nomor WA.
4. **Fase 3 — Finance:** catat pemasukan per termin & pengeluaran, kalkulasi untung/rugi otomatis.
5. **Fase 4 — Invoice & Nota:** setting identitas agency, generate invoice/nota dari data transaksi, export PNG/JPG/PDF.
6. **Fase 5 — Idea:** CRUD idea (teks/dokumen/gambar/link), kategori preset + custom.
7. **Fase 6 — Reference:** browser in-app, kategori link, tambah/hapus link manual.
8. **Fase 7 — Archive:** pindah project selesai ke Archive, pindah folder fisik ke sub-folder Arsip.
9. **Fase 8 — Dashboard:** widget ringkasan (status, klien, overdue, keuangan) narik data dari semua modul yang sudah jadi.
10. **Fase 9 — Settings & Polish:** folder utama, kategori custom, dark/light mode, export/import backup data.
11. **Fase 10 — Tugas Harian:** CRUD tugas mandiri (jadwal, prioritas, kategori, selesai), lalu pengingat/notifikasi desktop lokal.

Urutan ini juga jadi acuan urutan `priority` di `feature_list.json`.

---

Catatan: PRD ini living doc, bakal berkembang seiring keputusan fitur baru.

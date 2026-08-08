# PRD: Rakit

**Rapikan Â· Atur Â· Kembangkan Â· Ide Â· Terbitkan**

Aplikasi desktop personal untuk desainer grafis, satu ruang kerja dari ide mentah sampai project terbayar.

---

## 1. Ringkasan Eksekutif

**Problem Statement:** Sebagai desainer grafis, sering kesulitan brainstorming ide begitu dapat project baru, progress project susah dilacak, untung-rugi tiap project gak jelas, ide numpuk gak keurus, dan referensi visual tersebar di banyak tab browser yang campur aduk sama urusan pribadi.

**Proposed Solution:** Rakit menyatukan kebutuhan tracking project, keuangan, idea vault, dan reference browser dalam satu aplikasi desktop offline, lokal sepenuhnya, jadi gak perlu lompat-lompat antar tools buat urusan yang sebenarnya saling terkait.

**Success Criteria:**
- Semua project aktif punya catatan pemasukan-pengeluaran yang match 1:1 dengan kondisi rekening/tunai asli â€” gak ada lagi tebak-tebak untung-rugi.
- Idea vault jadi satu-satunya tempat nyimpen ide, gak ada lagi ide yang "lupa disimpan di mana".
- Reference browser gantiin kebiasaan buka tab Chrome buat riset visual pas kerja.
- Folder project rapi otomatis â€” setiap project baru langsung punya folder sendiri di dalam folder utama, dengan kode yang konsisten.
- App 100% jalan offline (gak ada dependency internet sama sekali di versi ini).

## 2. Target Users

Dirinya sendiri, desainer grafis merangkap developer aplikasi ini. Personal use, belum untuk publik. Login/akun sengaja **belum** ada di versi ini â€” direncanakan upgrade bertahap nanti (lihat Non-Goals).

## 3. Struktur Halaman & Fitur Utama

Navigasi sidebar (base komponen: shadcn/ui block `sidebar-07`), 7 halaman:

1. **Dashboard** â€” ringkasan semua project (status, overdue, klien, keuangan) dalam satu layar.
2. **Project** â€” daftar & tracking semua project aktif. 4 tampilan: List, Table, Kanban, Kalender.
3. **Finance** â€” keuangan per project (pemasukan per termin + pengeluaran), status untung/rugi, invoice & nota.
4. **Idea** â€” idea vault, khusus nyimpen ide (teks, dokumen, gambar, link), dikelompokkan per kategori.
5. **Reference** â€” browser in-app buat buka referensi desain, link dikelompokkan per kategori, ditambah manual.
6. **Archive** â€” project yang sudah selesai dipindah ke sini biar gak numpuk di daftar utama; folder fisiknya juga dipindah ke folder Arsip di dalam folder utama.
7. **Settings** â€” pengaturan aplikasi: folder utama, identitas agency (nama, logo) buat invoice/nota, kategori custom (Idea/Reference), tema (dark/light).

## 4. User Stories & Acceptance Criteria

### Project

Sebagai desainer, mau lacak semua project dengan fleksibel â€” kadang mau lihat daftar cepat, kadang mau lihat alur kerja per tahap, kadang mau lihat berdasarkan deadline.

- **AC:** Project bisa ditampilkan dalam 4 mode â€” List, Table, Kanban, Kalender â€” data tetap sinkron di semua mode, ganti tampilan tanpa loading yang kelihatan.
- **AC:** Kolom Kanban: **Brief â†’ Konsep â†’ Revisi â†’ Finalisasi â†’ Selesai**.
- **AC:** Tiap project punya: nama, klien, nomor WhatsApp klien (klik langsung buka chat WA), status kanban, status pembayaran (**Belum Lunas / DP / Lunas**), deadline, brief/deskripsi.
- **AC:** Klik "Tambah Project" otomatis bikin folder baru di dalam folder utama, dengan kode folder format `RKT-001-namaklien-tanggal` (nomor urut naik otomatis).
- **AC:** Dari halaman Project Detail, ada tombol buka folder lokal project langsung ke file explorer OS.
- **AC:** Due date yang lewat ditandai visual beda (bukan cuma warna, ada ikon) di semua tampilan.
- **AC:** Project yang ditandai "Selesai" bisa dipindah ke Archive (lihat section Archive).

### Finance

Sebagai desainer, mau catat pemasukan per termin dan pengeluaran tiap project biar tahu untung-rugi, dan bisa langsung bikin invoice/nota dari situ.

- **AC:** Pemasukan dicatat per termin (DP, pelunasan, dst) dengan nominal dan tanggal masing-masing.
- **AC:** Pengeluaran dicatat per project dengan nominal, tanggal, catatan.
- **AC:** Owner mencatat pengeluaran dari popup Finance setelah Invoice dan Nota project dibuat. Popup hanya menampilkan project yang memiliki pesanan serta kedua dokumen tersebut.
- **AC:** Ringkasan untung/rugi kehitung otomatis begitu ada transaksi baru â€” gak perlu tombol "hitung ulang".
- **AC:** Finance menampilkan hasil riil per project: omset dari seluruh pesanan, total pengeluaran, dan margin (omset dikurangi pengeluaran).
- **AC:** Ada halaman pengaturan invoice/nota (logo agency, nama agency, format penomoran) sebelum generate dokumen pertama.
- **AC:** Invoice & nota di-generate otomatis dari data transaksi yang sudah ada (gak input ulang manual), bisa di-export ke **PNG, JPG, atau PDF**.

### Idea

Sebagai desainer, mau simpan ide kapan pun kepikiran, dalam bentuk apa pun, tanpa ribet mikir taruh di mana.

- **AC:** Idea bisa berupa teks, dokumen, gambar, atau link.
- **AC:** Tiap ide masuk satu kategori (kategori awal preset, user bisa tambah kategori baru sendiri lewat Settings).

### Reference

Sebagai desainer, mau riset visual tanpa keluar dari app dan tanpa nyampur sama tab kerjaan lain.

- **AC:** Reference adalah browser beneran di dalam app (bukan cuma daftar link) â€” buka website sungguhan di dalam Rakit.
- **AC:** Link disimpan manual oleh user, dikelompokkan per kategori.

### Archive

Sebagai desainer, mau daftar project utama tetap bersih dari project yang sudah kelar.

- **AC:** Project berstatus "Selesai" bisa diarsipkan lewat satu aksi.
- **AC:** Saat diarsipkan, folder fisik project dipindah ke sub-folder Arsip di dalam folder utama (bukan dihapus).
- **AC:** Project yang diarsipkan tetap bisa dibuka/dilihat detailnya (read-only atau tetap bisa diedit â€” diputuskan saat implementasi), tapi gak muncul di daftar Project utama.

### Settings

- **AC:** Bisa atur/ganti folder utama tempat semua folder project dibuat.
- **AC:** Bisa atur identitas agency (nama, logo) buat dipakai di invoice/nota.
- **AC:** Bisa tambah/kelola kategori custom untuk Idea dan Reference.
- **AC:** Bisa ganti tema dark/light. Panel popup memakai warna kontras terbalik: putih saat tema gelap, hitam saat tema terang.
- **AC:** Bisa export data (backup manual) dan import dari file backup.

## 5. Data Model (Entitas Utama)

Gambaran awal, detail kolom lengkap disusun saat implementasi schema:

- **Project** â€” kode (`RKT-001-namaklien-tanggal`), nama, klien, nomor WA, brief, status kanban, status pembayaran, deadline, tanggal mulai, path folder lokal, archived flag.
- **Transaksi Keuangan** â€” relasi ke Project, tipe (pemasukan/pengeluaran), termin (kalau pemasukan), nominal, tanggal, catatan.
- **Invoice/Nota** â€” relasi ke Project, nomor (auto sesuai format Settings), tanggal, item (dari data transaksi), format export terakhir.
- **Idea** â€” tipe konten (teks/dokumen/gambar/link), kategori, isi/path file, tanggal dibuat.
- **Reference** â€” url, judul, kategori, tanggal ditambah.
- **Settings** â€” path folder utama, nama & logo agency, format penomoran invoice/nota, daftar kategori custom (Idea/Reference), tema aktif.

## 6. Technical Stack

- **Desktop shell:** Tauri (Rust) â€” dipilih karena jauh lebih ringan dari Electron (installer kecil, RAM rendah), cocok untuk kebutuhan "full desktop, gak boleh berat".
- **Frontend:** React + TypeScript + Vite
- **Database lokal:** SQLite lewat Tauri SQL plugin â€” lebih tepat dari IndexedDB/Dexie karena app ini full lokal (bukan browser-first) dan butuh integritas data kuat buat catatan keuangan.
- **Routing:** React Router
- **State UI (non-persisten):** Zustand
- **Drag-and-drop:** dnd-kit (Kanban Project)
- **Komponen UI:** shadcn/ui, base layout dari block `sidebar-07`
- **PDF/gambar export:** library client-side (dipilih saat implementasi halaman Finance)
- **Akses file system:** Tauri API (buka folder, buat folder, dialog file)

## 7. Non-Functional Requirements

- **Performa:** app kebuka dari splash sampai Dashboard siap pakai dalam hitungan detik; aksi simpan data (project, transaksi, ide) kerasa instan.
- **Keandalan:** app 100% jalan offline â€” gak ada fitur yang bergantung ke internet di versi ini.
- **Usability:** langsung kepake tanpa tutorial â€” bisa bikin project pertama dalam waktu singkat dari pertama buka app.
- **Keamanan data:** karena belum ada login/cloud, satu-satunya proteksi data adalah file lokal itu sendiri â€” makanya fitur export/import backup manual (Settings) penting ada dari awal.

## 8. Non-Goals (bukan bagian dari PRD ini)

- Login/akun dan cloud sync â€” sengaja ditunda, direncanakan upgrade bertahap di versi berikutnya.
- Chat AI/brainstorming asisten â€” dihilangkan dari scope versi ini.
- Reminder/notifikasi due date â€” ditunda, upgrade nanti.
- Multi-user atau kolaborasi tim.
- Sistem langganan publik / model bisnis SaaS.
- Integrasi otomatis ke sumber referensi luar (Pinterest, Behance, dll) â€” link tetap ditambah manual.
- Versi web atau mobile â€” Rakit sengaja desktop-only.

## 9. Roadmap Pengerjaan Bertahap

Karena dikerjakan lintas sesi (pindah-pindah chat/token terbatas), project ini dipecah per fase kecil. Tiap fase = beberapa entri di `feature_list.json`, dikerjakan satu per satu, gak boncos token dalam satu sesi.

1. **Fase 0 â€” Fondasi:** setup Tauri + React + Vite + TypeScript, setup shadcn/ui, setup SQLite + schema awal, App Shell (`sidebar-07`) kosong dengan 7 menu.
2. **Fase 1 â€” Project (List & Table):** CRUD project dasar, tampilan List dan Table, buat folder otomatis + kode folder, tombol buka folder lokal.
3. **Fase 2 â€” Project (Kanban & Kalender):** tampilan Kanban (drag-drop dnd-kit), tampilan Kalender, status pembayaran, klik nomor WA.
4. **Fase 3 â€” Finance:** catat pemasukan per termin & pengeluaran, kalkulasi untung/rugi otomatis.
5. **Fase 4 â€” Invoice & Nota:** setting identitas agency, generate invoice/nota dari data transaksi, export PNG/JPG/PDF.
6. **Fase 5 â€” Idea:** CRUD idea (teks/dokumen/gambar/link), kategori preset + custom.
7. **Fase 6 â€” Reference:** browser in-app, kategori link, tambah/hapus link manual.
8. **Fase 7 â€” Archive:** pindah project selesai ke Archive, pindah folder fisik ke sub-folder Arsip.
9. **Fase 8 â€” Dashboard:** widget ringkasan (status, klien, overdue, keuangan) narik data dari semua modul yang sudah jadi.
10. **Fase 9 â€” Settings & Polish:** folder utama, kategori custom, dark/light mode, export/import backup data.

Urutan ini juga jadi acuan urutan `priority` di `feature_list.json`.

---

Catatan: PRD ini living doc, bakal berkembang seiring keputusan fitur baru.

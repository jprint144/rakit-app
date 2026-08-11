# claude-progress.md â€” Rakit

Log progress project. Baca bagian **Current Verified State** di awal tiap sesi. Update bagian ini + tambah **Session Record** baru di akhir tiap sesi.

---

## Current Verified State

- **Repository root directory:** `D:\PROJECT VIBECODERS\RAKIT-V2.0.0` (mesin Windows asli, bukan sandbox lagi).
- **Standard startup path:** `./init.sh` (jalankan lewat Git Bash)
- **Standard verification path:** `npm run build` â€” **SUDAH LOLOS** di mesin Windows (Sesi 2).
- **Prasyarat mesin dev â€” SUDAH TERKONFIRMASI LENGKAP (Sesi 2):** Rust 1.97.1, MSVC Build Tools 2026, WebView2 Runtime 150.0.4078.105.
- **`npm run tauri dev` SUDAH PERNAH JALAN (Sesi 2):** compile Rust pertama 2m 15s, `app.exe` kebuka, dev server Vite di port 1420 sehat.
- **Highest priority unfinished feature:** `settings-folder-utama` (priority 23, `not_started`). Seluruh fitur hingga Dashboard (priority 22) sudah passing.
- **Current blocker:** Tidak ada blocker teknis.
- **Catatan verifikasi sesi terbaru:** `npm install` lulus dan `npm run build` lulus pada 2026-08-11 di lingkungan Windows penuh (3107 modul). Pemanggilan `init.sh` langsung tidak tersedia karena Git Bash tidak ada di `PATH` sesi ini; perintah install dan verifikasi skrip telah dijalankan setara.
- **Catatan verifikasi sesi terbaru:** `./init.sh` lulus pada 2026-08-10: `npm install` bersih dan `npm run build` berhasil (3091 modul). Aplikasi Tauri dev juga berhasil terbuka; otomasi UI host tetap dapat diblokir dengan `spawn EPERM`.
- **Perubahan UI terbaru:** Halaman Finance memakai FAB bulat di pojok kanan bawah untuk membuka popup input pengeluaran desktop; verifikasi visual runtime masih diperlukan.
- **Perubahan Project terbaru:** Aksi Brief per-project kini membuka file `brief.txt` tetap di folder project menggunakan Notepad Windows. Brief HTML lama dipindahkan sebagai teks saat file pertama kali dibuat; verifikasi runtime masih diperlukan.
- **Perilaku FAB Project:** Tombol tambah Project disembunyikan saat panel atau dialog Project apa pun terbuka (tambah/edit, Brief, Pesanan, Detail, atau konfirmasi hapus) agar tidak tertutup overlay.
- **Build distribusi terbaru:** Windows x64 `app.exe`, installer NSIS, dan installer MSI versi `0.1.5` berhasil dibuat pada 2026-08-11 dari source terbaru. Artefak updater bertanda tangan tidak dibuat karena private signing key tidak tersedia di environment.
- **Rilis GitHub terbaru:** `v0.1.6` sudah dipublikasikan pada 2026-08-11 dengan installer Windows NSIS `Rakit_0.1.6_x64-setup.exe`. Commit aplikasi: `d2f38cd`.

**Environment dev:**

- Windows 11 Pro for Workstations 64-bit (Build 26200)
- Intel Core i5-12450H, 16GB RAM, MSI Thin GF63 12UC
- Rust 1.97.1 âœ…, MSVC Build Tools 2026 âœ…, WebView2 150.0 âœ…

**Fase roadmap saat ini:** Fase 1 â€” Project (folder otomatis)

---

## Session Record

### Sesi 58 - Publikasi GitHub Release v0.1.6 (2026-08-11)

- **Goal:** Mempublikasikan seluruh pembaruan lokal sebagai rilis aplikasi.
- **Completed:** Versi aplikasi dinaikkan menjadi `0.1.6`, seluruh 97 file pembaruan di-commit sebagai `d2f38cd` (`release: v0.1.6`), didorong ke `master`, dan ditandai `v0.1.6`. GitHub Release dibuat dan memuat installer `Rakit_0.1.6_x64-setup.exe` (6.49 MB).
- **Verification run:** `npm install` dan `npm run build` lulus (3107 modul). Tauri release build menghasilkan installer NSIS x64 dan aset Release GitHub terverifikasi berstatus `uploaded`.
- **Commits:** `d2f38cd release: v0.1.6`.
- **Known risks:** Auto-update Tauri belum dapat dipakai karena `TAURI_SIGNING_PRIVATE_KEY` tidak tersedia, sehingga file updater bertanda tangan tidak dibuat. Unduh/pasang installer release tetap normal.
- **Next best action:** Pasang installer dari GitHub Release untuk memperbarui aplikasi lokal; konfigurasi private signing key bila ingin mengaktifkan pembaruan otomatis.

### Sesi 57 - Pembaruan executable Windows (2026-08-11)

- **Goal:** Memperbarui executable aplikasi dari source terbaru.
- **Completed:** `npm install` lulus tanpa perubahan dependency dan `npm run build` lulus (3107 modul). Tauri release build menghasilkan `src-tauri/target/release/app.exe`, installer NSIS `src-tauri/target/release/bundle/nsis/Rakit_0.1.5_x64-setup.exe`, serta installer MSI `src-tauri/target/release/bundle/msi/Rakit_0.1.5_x64_en-US.msi`.
- **Verification run:** Build frontend dan kompilasi release Rust lulus. Packaging NSIS/MSI lulus. Tahap updater gagal karena konfigurasi mendeteksi public key tanpa `TAURI_SIGNING_PRIVATE_KEY`; hal tersebut tidak memengaruhi executable maupun kedua installer yang sudah berhasil dibuat.
- **Commits:** Belum dibuat.
- **Known risks:** File update otomatis bertanda tangan belum tersedia sampai private key release dikonfigurasi.
- **Next best action:** Pasang installer NSIS terbaru untuk memperbarui aplikasi lokal, atau konfigurasikan signing key bila ingin menerbitkan pembaruan otomatis GitHub Releases.

### Sesi 56 - Ringkasan Finance project arsip (2026-08-11)

- **Goal:** Memperbaiki kartu Finance yang tidak menghitung riwayat transaksi project arsip.
- **Completed:** Query `listProjectFinancialSummaries` tidak lagi menyaring `projects.archived = 0`. Project kini masuk ringkasan bila memiliki pesanan atau transaksi, sehingga omset, pengeluaran, dan margin historis tetap dihitung setelah project dipindahkan ke Archive.
- **Verification run:** `npm run build` lulus (3107 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Aplikasi terpasang perlu diperbarui atau direstart dari build terbaru untuk menampilkan nilai yang telah dikoreksi.
- **Next best action:** Jalankan build terbaru dan buka Finance untuk memastikan RKT-015 masuk pada kartu serta tabel Hasil Riil per Project.

### Sesi 55 - Verifikasi runtime Dashboard (2026-08-11)

- **Goal:** Memverifikasi Dashboard dari source terbaru.
- **Completed:** Menjalankan `npm run tauri dev` dan membuka aplikasi debug. Dashboard menampilkan kelima kartu termasuk Klien Aktif, status per tahap, ringkasan keuangan, serta empty state overdue dengan tata letak benar. `dashboard-widget-ringkasan` ditandai passing.
- **Verification run:** Runtime Tauri dev lulus; build produksi sebelumnya lulus (3107 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Project uji Archive tetap berada di data aplikasi build terpasang, terpisah dari database debug.
- **Next best action:** Mulai `settings-folder-utama` (priority 23).

### Sesi 54 - Dashboard ringkasan klien (2026-08-11)

- **Goal:** Memulai `dashboard-widget-ringkasan` sesuai roadmap.
- **Completed:** Meninjau data Project dan Finance yang digunakan Dashboard. Menambahkan kartu `Klien Aktif` dengan jumlah klien unik pada ringkasan Dashboard, melengkapi status project, overdue, dan keuangan yang sudah tersedia.
- **Verification run:** `npm run build` lulus (3107 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Verifikasi visual/runtime Dashboard dengan data aplikasi masih diperlukan sebelum feature ditandai passing.
- **Next best action:** Jalankan aplikasi dari source terbaru (`npm run tauri dev` atau build baru), lalu cek kartu Klien Aktif bersama ringkasan status, overdue, dan keuangan. Build terpasang yang diuji pada sesi ini masih menampilkan empat kartu lama, tetapi status, overdue, dan keuangan ter-render benar dari data lokal.

### Sesi 53 - Penyelesaian verifikasi Archive (2026-08-11)

- **Goal:** Menyelesaikan sisa verifikasi Detail dan perpindahan folder fisik Archive.
- **Completed:** Detail `RKT-017` di Archive berhasil dibuka dan menampilkan kembali kode, klien, status pembayaran, serta field yang disimpan. Tombol Folder membuka File Explorer pada `D:\#0 JOBS\RAKIT-V2.0.0\Arsip\RKT-017-verifikasi-lokal-2026-08-11`; breadcrumb mengonfirmasi folder berada di sub-folder `Arsip`, tidak di folder utama. `archive-pindah-project` dan `archive-pindah-folder-fisik` ditandai passing dengan evidence.
- **Verification run:** Uji runtime aplikasi desktop lulus untuk Archive, Detail, Folder Archive, dan path fisik. Baseline sesi ini: `npm install` lulus dan `npm run build` lulus (3107 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Project uji `RKT-017` sengaja tetap berada di Archive. Penghapusan membutuhkan persetujuan eksplisit karena bersifat destruktif.
- **Next best action:** Mulai `dashboard-widget-ringkasan` (priority 22), setelah project uji dipertahankan atau dibersihkan atas persetujuan user.

### Sesi 52 - Uji runtime Archive (2026-08-11)

- **Goal:** Menjalankan uji manual Archive dengan project berstatus Selesai.
- **Completed:** Membuat project uji `RKT-017 / Uji Archive 2026-08-11` untuk klien `Verifikasi Lokal`, lalu mengarsipkannya melalui dialog konfirmasi aplikasi. Project hilang dari daftar Project utama dan muncul di halaman Archive. Tombol Folder pada baris archive membuka File Explorer ke folder `RKT-017-verifikasi-lokal-2026-08-11`.
- **Verification run:** `npm install` lulus; `npm run build` lulus pada Windows penuh (3107 modul). Uji UI membuktikan dua kriteria pertama `archive-pindah-project` dan pembukaan folder project hasil archive.
- **Commits:** Belum dibuat.
- **Known risks:** Pemeriksaan panel Detail untuk data lengkap serta konfirmasi visual direktori induk `Arsip` belum selesai karena input langsung terdeteksi pada jendela desktop lalu jendela diminimalkan. Project uji tetap berada di Archive dan tidak dihapus.
- **Next best action:** Setelah jendela Rakit tersedia, buka Detail `RKT-017`, lalu verifikasi lokasi Explorer menunjukkan sub-folder `Arsip`; setelah itu minta persetujuan eksplisit sebelum menghapus project uji bila pembersihan diperlukan.

### Sesi 51 - Checkpoint Archive (2026-08-11)

- **Goal:** Melanjutkan verifikasi fitur Archive, termasuk perpindahan folder fisik ke sub-folder `Arsip`.
- **Completed:** Meninjau implementasi archive/restore dan capability Tauri. Baseline `npm install` dan `npm run build` lulus di Windows penuh (3107 modul). Aplikasi Rakit yang sedang berjalan dibuka; halaman Project terverifikasi tidak memiliki project aktif sehingga tidak ada project berstatus Selesai yang dapat diarsipkan sebagai uji runtime tanpa membuat data pengguna baru.
- **Verification run:** Build produksi lulus. Navigasi aplikasi menuju halaman Project lulus dan menampilkan daftar aktif kosong.
- **Commits:** Belum dibuat.
- **Known risks:** Pemindahan fisik `folder_path` ke `<folder utama>\\Arsip\\<nama folder>` dan pembaruan path SQLite masih menunggu satu uji runtime dengan project berstatus Selesai.
- **Next best action:** Buat atau siapkan satu project uji berstatus Selesai, pilih Arsipkan, lalu cek project hilang dari Project, muncul di Archive, dan folder berpindah tanpa duplikasi ke sub-folder `Arsip`.

### Sesi 34 - Brief file Notepad per project (2026-08-09)

- **Goal:** Mengubah Brief dari panel editor internal menjadi notepad eksternal yang tetap untuk setiap project.
- **Completed:** PRD diselaraskan. Tombol Brief sekarang memastikan `brief.txt` berada di folder project, membuatnya pada klik pertama, lalu membukanya dengan Notepad Windows melalui Tauri opener. Isi brief lama dari database dipindahkan sebagai teks ke file baru agar data sebelumnya tidak hilang. Panel rich-text dan input brief pada form Project dihapus agar hanya ada satu sumber catatan.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3091 modul). Peringatan ukuran bundle Vite tetap ada tanpa error.
- **Evidence recorded:** Implementasi berada di `src/features/project/project-brief.ts`; aksi Project memanggil fungsi tersebut.
- **Commits:** Belum dibuat.
- **Known risks:** Perlu klik Brief dua kali pada satu project di aplikasi Tauri untuk mengonfirmasi Notepad selalu membuka `brief.txt` yang sama dan isi yang disimpan di Notepad tetap ada.
- **Next best action:** Uji tombol Brief pada project yang sudah memiliki folder. Setelah memastikan file persisten, lanjutkan verifikasi manual `invoice-generate-export` yang masih berstatus `in_progress`.

### Sesi 35 - Izin Notepad untuk Brief (2026-08-09)

- **Goal:** Memperbaiki tombol Brief yang tidak membuka Notepad.
- **Completed:** Penyebabnya adalah scope Tauri opener yang hanya mengizinkan aplikasi default, sementara Brief meminta `notepad` secara eksplisit. Capability sekarang mengizinkan Notepad untuk file dalam folder project. Halaman Project juga menampilkan status berhasil atau pesan error setelah tombol Brief ditekan.
- **Verification run:** `npm run build` lulus (3091 modul).
- **Evidence recorded:** Perubahan izin berada di `src-tauri/capabilities/default.json` dan pesan respons berada di `src/pages/project.tsx`.
- **Commits:** Belum dibuat.
- **Known risks:** Capability Tauri baru hanya diterapkan setelah aplikasi desktop direstart.
- **Next best action:** Tutup lalu jalankan kembali `npm run tauri dev`, kemudian klik Brief pada project yang memiliki folder.

### Sesi 36 - Perbaikan pembuka Brief aktif (2026-08-09)

- **Goal:** Membuat Brief dapat dibuka dari aplikasi yang sedang berjalan.
- **Completed:** Menghapus permintaan aplikasi `notepad` eksplisit yang ditolak oleh backend Tauri lama saat hot reload. Brief sekarang dibuka dengan aplikasi default Windows untuk ekstensi `.txt` (Notepad pada konfigurasi Windows standar), yang sudah diizinkan pada process aplikasi yang sedang aktif. Pesan kegagalan juga menampilkan detail sebenarnya, bukan pesan generik.
- **Verification run:** `npm run build` lulus (3091 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Jika `.txt` telah diubah default-nya oleh user menjadi aplikasi lain, file akan terbuka di aplikasi tersebut, bukan Notepad.
- **Next best action:** Klik Brief lagi pada aplikasi dev yang sedang terbuka; file `brief.txt` harus dibuat/dibuka. Jika belum, catat detail pesan baru yang tampil di bawah judul Project.

### Sesi 37 - Izin pembuatan file Brief (2026-08-09)

- **Goal:** Memperbaiki kegagalan pembuatan `brief.txt` yang terkonfirmasi dari pesan aplikasi.
- **Completed:** Error menunjukkan `writeTextFile` belum diizinkan pada process Tauri yang aktif. Pembuatan file sekarang memakai `writeFile`, yang sudah memiliki izin dan scope folder project. Aplikasi dev menerima perubahan frontend melalui HMR tanpa restart backend.
- **Verification run:** `npm run build` lulus (3091 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Uji klik Brief diperlukan untuk membuktikan `brief.txt` dibuat lalu dibuka oleh aplikasi default Windows.
- **Next best action:** Klik Brief sekali lagi pada project RKT-015 yang sedang terbuka.

### Sesi 38 - Pulihkan akses Folder dan Brief (2026-08-09)

- **Goal:** Memperbaiki Folder dan Brief yang sama-sama ditolak oleh scope Tauri.
- **Completed:** Scope opener diperbaiki untuk mengizinkan dua cara buka dalam folder project: aplikasi default Windows (Folder) dan Notepad eksplisit (`brief.txt`). Frontend build serta `cargo check` lulus. Aplikasi Rakit dev direstart dan jendela baru berhasil terbuka pada 19:18.
- **Verification run:** `npm run build` lulus (3091 modul); `cargo check --manifest-path src-tauri/Cargo.toml` lulus.
- **Commits:** Belum dibuat.
- **Known risks:** Perlu uji UI akhir: Folder harus membuka File Explorer dan Brief harus membuka Notepad dengan `brief.txt` yang sama.
- **Next best action:** Klik Folder, lalu Brief, pada RKT-015 di jendela Rakit yang baru.

### Sesi 39 - Template Invoice profesional + tanda tangan (2026-08-09)

- **Goal:** Merapikan desain hasil invoice export dan menambahkan tanda tangan asli Januarianto.
- **Completed:** Template Invoice/Nota dirombak menjadi kartu dokumen profesional dengan header identitas agency, area metadata client/project yang ringkas, tabel item berhierarki jelas, total yang tegas, serta blok instruksi pembayaran. Logo kini mempertahankan MIME asli PNG/JPG. Export tidak lagi memaksa semua elemen menjadi putih, sehingga gaya template ikut terbawa. Tanda tangan asli dari user disimpan sebagai `src/assets/januarianto-signature.png` dan ditampilkan di atas nama penandatangan dalam blok penutup.
- **Verification run:** `npm run build` lulus (3092 modul). Aset tanda tangan ter-bundle pada output Vite.
- **Commits:** Belum dibuat.
- **Known risks:** Tampilan akhir PNG/PDF masih perlu diuji melalui generate ulang dari aplikasi karena html2canvas merender di runtime.
- **Next best action:** Generate ulang Invoice untuk RKT-015 lalu export PNG/PDF dan periksa header logo, tabel, serta posisi tanda tangan di atas nama.

### Sesi 40 - Perbaikan izin unduh Invoice (2026-08-09)

- **Goal:** Memperbaiki ekspor Invoice/Nota yang gagal disimpan ke `D:\`.
- **Completed:** Penyebabnya adalah scope filesystem hanya mengizinkan folder project, sedangkan dialog Save memilih `D:\invoice-…`. Scope tulis drive D ditambahkan agar hasil PNG/JPG/PDF dari dialog dapat ditulis. Aplikasi Rakit dev direstart dan jendela baru terbuka pada 19:51.
- **Verification run:** `npm run build` lulus (3092 modul); `cargo check --manifest-path src-tauri/Cargo.toml` lulus.
- **Commits:** Belum dibuat.
- **Known risks:** Uji runtime satu ekspor diperlukan untuk membuktikan file benar-benar tersimpan pada lokasi pilihan.
- **Next best action:** Generate Invoice, klik Download PNG atau PDF, pilih lokasi di drive D, lalu buka file hasilnya.

### Sesi 41 - Tombol unduh Invoice selalu terlihat (2026-08-09)

- **Goal:** Membuat aksi download Invoice/Nota mudah ditemukan.
- **Completed:** Tombol PNG, JPG, dan PDF dipindahkan dari bawah preview tinggi ke panel pembuat dokumen di sisi kiri. Tombol muncul langsung setelah Invoice atau Nota berhasil dibuat, sehingga tetap terlihat tanpa perlu scroll sampai akhir preview.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Perlu klik tombol baru untuk memastikan dialog simpan muncul dan output tersimpan di drive D.
- **Next best action:** Pada Nota INV-016 yang sudah dibuat, klik PDF/PNG pada panel kiri lalu pilih lokasi simpan di drive D.

### Sesi 42 - Kompatibilitas warna html2canvas (2026-08-09)

- **Goal:** Mengatasi kegagalan export dengan error `Attempting to parse an unsupported color function \"oklch\"`.
- **Completed:** Pada salinan DOM untuk export, seluruh warna tema `oklch` dinormalisasi ke RGB yang didukung html2canvas. Header dan total tetap diberi warna gelap, header tabel tetap abu-abu, sementara tampilan aplikasi utama tidak diubah.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Perlu klik PNG/PDF di runtime untuk memastikan dialog Save muncul dan file valid tersimpan.
- **Next best action:** Klik PNG atau PDF pada Invoice INV-017 tanpa perlu generate ulang, lalu pilih lokasi simpan di drive D.

### Sesi 43 - Normalisasi akar Preview ekspor (2026-08-09)

- **Goal:** Menutup sisa kemungkinan error `oklch` pada ekspor.
- **Completed:** Normalisasi RGB kini mencakup elemen akar `#invoice-export-preview`, bukan hanya seluruh elemen turunannya. Ini menghilangkan token `bg-card`/`text-card-foreground` berformat `oklch` yang tersisa pada akar preview.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Hasil runtime klik PNG/PDF masih perlu dikonfirmasi.
- **Next best action:** Klik PDF pada INV-017 dan kirim teks error yang muncul bila dialog Save masih belum tampil.

### Sesi 44 - Normalisasi token tema ekspor (2026-08-09)

- **Goal:** Menangani error `oklch` yang masih terjadi ketika PNG/PDF dibuat.
- **Completed:** Token warna global shadcn/Tailwind (`--background`, `--primary`, `--muted`, dan lainnya) kini diganti dengan RGB hanya pada dokumen clone milik html2canvas sebelum proses render. Body clone juga dipaksa RGB, sehingga renderer tidak lagi menerima fungsi warna `oklch`.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Runtime ekspor masih perlu dipastikan dengan sekali klik PNG/PDF.
- **Next best action:** Klik PDF pada INV-019; jika tidak muncul dialog simpan, ambil teks error terbaru.

### Sesi 45 - Gaya Invoice referensi biru-putih (2026-08-09)

- **Goal:** Menyesuaikan Invoice/Nota dengan referensi visual user.
- **Completed:** Preview memakai pola editorial biru-putih: header logo dan judul Invoice besar, identitas klien yang lapang, tabel dengan kepala biru muda, blok Total biru muda, serta footer pembayaran/tanda tangan biru muda. Token desain invoice ditambahkan agar konsisten di tema terang/gelap; clone export memiliki nilai RGB ekuivalen.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Visual export dan aksi download runtime tetap perlu dikonfirmasi karena html2canvas belum dapat diuji langsung dari sandbox.
- **Next best action:** Generate ulang Invoice untuk melihat gaya baru, lalu klik PDF untuk menguji dialog Save.

### Sesi 46 - Perbaikan artefak PNG Invoice (2026-08-09)

- **Goal:** Menghilangkan blok putih pada tabel dan tanda tangan di export PNG.
- **Completed:** Penyebabnya adalah normalisasi exporter yang sebelumnya memberi latar putih pada setiap elemen, termasuk sel/header tabel. Normalisasi kini hanya diterapkan pada akar preview dan elemen berwarna khusus. Latar putih tanda tangan asli juga diproses menjadi transparan dan aset baru dipakai pada Invoice.
- **Verification run:** `npm run build` lulus (3092 modul); aset tanda tangan transparan ter-bundle.
- **Commits:** Belum dibuat.
- **Known risks:** Perlu export ulang satu PNG untuk verifikasi visual akhir pada file hasil.
- **Next best action:** Export ulang INV-022 ke PNG dan periksa tabel biru serta tanda tangan yang seharusnya kini tanpa kotak putih.

### Sesi 47 - Tata letak header Invoice (2026-08-09)

- **Goal:** Merapikan bagian atas Invoice sesuai referensi: identitas kiri, judul dan nomor kanan.
- **Completed:** Header kini dibagi grid dua kolom yang stabil: logo dan identitas agency utuh di kiri; judul INVOICE/NOTA besar dan nomor dokumen berdiri sendiri, rata kanan. Alamat ditempatkan sebagai subteks di blok identitas agar tidak bersaing dengan nomor invoice.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Perlu generate/export ulang untuk memeriksa hasil visual header pada file PNG.
- **Next best action:** Generate ulang Invoice dan export PNG untuk mengecek header kiri/kanan yang baru.

### Sesi 48 - Header Invoice tiga bagian (2026-08-09)

- **Goal:** Mengikuti tata letak header eksplisit dari user.
- **Completed:** Header kini memiliki: (1) logo kiri serta judul Invoice dan nomor di kanan, (2) garis pemisah, (3) nama/alamat usaha di kiri serta nomor telepon/email di kanan, lalu garis pemisah kedua sebelum informasi tagihan.
- **Verification run:** `npm run build` lulus (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Perlu generate ulang untuk konfirmasi visual pada preview/export.
- **Next best action:** Generate ulang satu Invoice dan periksa dua garis pemisah serta posisi informasi header.

### Sesi 49 - Rasio logo dan tanda tangan Invoice (2026-08-09)

- **Goal:** Memperbaiki logo dan tanda tangan yang tampak gepeng pada hasil ekspor.
- **Completed:** Kedua gambar tidak lagi diberi lebar dan tinggi tetap secara bersamaan. Logo memakai tinggi tetap dengan lebar otomatis, sedangkan tanda tangan memakai lebar tetap dengan tinggi otomatis serta wadah yang cukup untuk nama penandatangan. Rasio gambar asli kini dipertahankan pada preview dan ekspor.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3092 modul).
- **Commits:** Belum dibuat.
- **Known risks:** Hasil PNG lama tidak berubah; dokumen perlu dibuat dan diekspor ulang untuk memakai tata letak baru.
- **Next best action:** Generate ulang Invoice, ekspor PNG, lalu pastikan logo dan tanda tangan memiliki proporsi asli.

### Sesi 50 - Penyempurnaan Invoice/Nota dan pembayaran (2026-08-10)

- **Goal:** Menyelaraskan tampilan Invoice/Nota, ekspor, serta metode pembayaran dengan arahan visual pengguna.
- **Completed:** Template dokumen memakai Figtree, tata letak header dan tabel diperbarui, serta pengaturan Invoice dipindah menjadi panel geser kanan seperti Project/Keuangan. Pemilih Invoice/Nota dan Project sejajar. Nomor dokumen sekarang mengambil urutan setelah ID Invoice terbesar agar tidak bentrok jika data lama dihapus. Pengaturan mendukung banyak rekening bank (nama bank, nomor rekening, atas nama) yang tersimpan sebagai data Settings dan tampil di blok pembayaran. Catatan pembayaran dihapus; unggah tanda tangan khusus ditambahkan dengan fallback tanda tangan bawaan. Exporter kembali menormalkan token warna RGB global agar tidak menolak `oklch`, tanpa mengubah struktur layout preview.
- **Verification run:** `npm run build` lulus pada 2026-08-10 (3091 modul). Peringatan bundle utama di atas 500 kB tetap ada tanpa error.
- **Commits:** Belum dibuat.
- **Known risks:** Uji runtime akhir masih diperlukan: tambah rekening, upload tanda tangan, Generate Invoice/Nota, lalu unduh PNG dan PDF untuk memastikan file hasil identik dengan preview dan tidak memunculkan error warna.
- **Next best action:** Lakukan satu uji manual lengkap pada RKT-015. Jika lolos, isi evidence dan tandai `invoice-generate-export` passing sebelum berpindah ke fitur Idea CRUD.

### Sesi 33 - Checkpoint verifikasi Invoice/Nota (2026-08-09)

- **Goal:** Melanjutkan fitur aktif `invoice-generate-export` dan memverifikasi baseline sebelum pengujian runtime.
- **Completed:** Membaca ulang PRD dan status fitur; meninjau implementasi Invoice/Nota gabungan per project, penomoran, penyimpanan ekspor, serta alur finance terkait. `npm install` lulus dan `npm run build` lulus di lingkungan Windows penuh (3145 modul). `npm run tauri dev` juga berhasil membuka jendela Rakit untuk uji manual.
- **Verification run:** Build produksi lulus. Otomasi Windows pada sesi ini berhenti dengan `spawn EPERM`, sehingga klik Generate dan dialog Save As tidak dapat dieksekusi otomatis.
- **Evidence recorded:** Output build Vite sukses: 3145 modul ditransformasi, tanpa error TypeScript.
- **Commits:** Tidak ada.
- **Known risks:** Verifikasi manual masih diperlukan untuk project dengan minimal dua pesanan: pastikan seluruh item tampil di Invoice dan Nota, nomor mengikuti prefix, lalu ekspor PNG/JPG/PDF dan buka masing-masing file.
- **Next best action:** Pada jendela Rakit yang sudah berjalan, pilih project berpesanan, generate Invoice dan Nota, lalu ekspor setidaknya PNG dan PDF. Jika valid, isi evidence dan tandai `invoice-generate-export` sebagai `passing`, kemudian lanjut `idea-crud` (priority 16).

### Sesi 19 - Notepad Brief per Project (2026-08-08)

- **Goal:** Menambahkan akses notepad khusus untuk brief pada setiap project.
- **Completed:** Tombol Brief ditambahkan ke aksi tiap baris Project. Panel kanan menyediakan rich-text notepad yang memperbarui field `projects.brief` tanpa mengubah schema. Panel menampilkan konteks project, template awal, jumlah kata, heading/checklist/format/tautan/gambar lokal yang lebarnya dapat diatur bebas dengan menarik handle sudut, autosave dengan status akurat, dan aksi simpan langsung. PRD diperbarui untuk mendokumentasikan perilaku ini.
- **Verification run:** Menunggu `npx tsc -b` setelah handle resize gambar ditambahkan.
- **Evidence recorded:** Implementasi berada di `src/features/project/project-brief-sheet.tsx` dan action Project.
- **Commits:** Belum dibuat.
- **Known risks:** Verifikasi visual dan penyimpanan runtime Tauri masih diperlukan.
- **Next best action:** Buka Project, klik Brief pada salah satu baris, tulis catatan, simpan, lalu buka kembali untuk memastikan isi tersimpan.

### Sesi 18 - FAB input pengeluaran (2026-08-08)

- **Goal:** Memindahkan aksi input pengeluaran ke tombol bulat di pojok kanan bawah dan memastikan form tampil nyaman sebagai popup desktop.
- **Completed:** Tombol teks pada header Finance diganti FAB berbentuk bulat, berikon tambah, berlabel aksesibel, dan tetap berada di kanan bawah layar. Ukurannya disamakan dengan FAB Project (`size-12`) serta disembunyikan ketika panel terbuka; form pengeluaran kini berupa panel popup di sisi kanan desktop dengan scroll internal. Panel dirapikan dengan struktur header, ringkasan project, field berjarak konsisten, dan footer aksi yang jelas.
- **Verification run:** `npm install` lulus. `npm run build` tidak dapat berjalan dalam sandbox karena binary native Tailwind diblokir (`spawn EPERM`); baseline sebelumnya lulus di Windows penuh pada 2026-08-08.
- **Evidence recorded:** Perubahan terarah pada `src/pages/finance.tsx` dan `src/features/finance/expense-dialog.tsx`.
- **Commits:** Belum dibuat.
- **Known risks:** Verifikasi visual klik FAB dan tampilan popup desktop masih perlu dilakukan di aplikasi Tauri Windows.
- **Next best action:** Jalankan `npm run tauri dev`, buka Keuangan, klik tombol bulat kanan bawah, lalu simpan satu pengeluaran untuk memastikan dialog dan refresh data berjalan.

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
- **Verification run:** `npm run build` lulus (3139 modul); `npm run tauri build -- --no-sign` lulus dan menghasilkan installer NSIS serta MSI 0.1.3. Peringatan ukuran bundle utama di atas 500 kB tetap ada tanpa error.
- **Known risks:** Perubahan belum diuji manual di aplikasi Tauri dengan project yang memiliki lebih dari satu pesanan.
- **Next best action:** Pasang installer NSIS 0.1.3 terbaru, pilih project dengan minimal dua pesanan, lalu generate Invoice dan Nota untuk memastikan seluruh item serta total tampil pada keduanya.

### Sesi 31 - Pengeluaran dan margin riil owner (2026-08-08)

- **Goal:** Menjadikan pengeluaran project sebagai tahap penutup setelah Invoice dan Nota selesai, sekaligus menampilkan omset, pengeluaran, dan margin riil.
- **Completed:** Halaman Finance kini menyediakan tombol **Input Pengeluaran** dengan popup. Project yang bisa dipilih harus memiliki pesanan serta kedua dokumen Invoice dan Nota. Popup menampilkan jumlah pesanan, omset, dan margin saat ini sebelum nominal, tanggal, serta catatan biaya disimpan. Tabel hasil riil per project dan tiga kartu ringkasan menghitung omset dari transaksi pesanan, total pengeluaran, dan margin secara langsung.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3141 modul). Sandbox biasa memblokir binary native Tailwind/Vite dengan `spawn EPERM`.
- **Commits:** `ac58050 feat: add owner expense and margin workflow`.
- **Known risks:** Perlu verifikasi manual: buat Invoice dan Nota untuk satu project berpesanan, pastikan project menjadi pilihan popup, lalu simpan pengeluaran dan cek tiga nilai ringkasan serta baris project berubah tanpa refresh manual.
- **Next best action:** Uji alur owner di aplikasi Tauri dan rilis versi baru melalui tag GitHub.

### Sesi 32 - Persiapan rilis updater 0.1.5 (2026-08-08)

- **Goal:** Memperbaiki tag updater `v0.1.4` yang dibuat sebelum versi aplikasi dinaikkan, agar client bisa menerima fitur pengeluaran baru.
- **Completed:** Versi diselaraskan menjadi `0.1.5` pada package, konfigurasi Tauri, dan Cargo. `npm run build` lulus (3141 modul), dan `cargo check --manifest-path src-tauri/Cargo.toml` lulus untuk `app v0.1.5`.
- **Known risks:** Rilis baru bergantung pada GitHub Actions serta secrets signing updater yang sudah dikonfigurasi di repository.
- **Next best action:** Push tag `v0.1.5`, cek workflow Release Rakit berhasil, kemudian buka aplikasi 0.1.3 untuk memastikan dialog Update tersedia.

### Sesi 50 - Baseline dan runtime Invoice (2026-08-10)

- **Goal:** Melanjutkan fitur aktif `invoice-generate-export` dan menyiapkan verifikasi runtime akhir.
- **Completed:** Menjalankan `./init.sh` melalui Git Bash: `npm install` bersih dan `npm run build` lulus (3091 modul). `npm run tauri dev` berhasil menyalakan server dan membuka proses desktop `app`.
- **Verification run:** Build produksi lulus; hanya peringatan ukuran bundle di atas 500 kB tanpa error.
- **Known risks:** Verifikasi visual dan native Save dialog masih harus dilakukan secara interaktif. Otomasi Windows dari host ini gagal dengan `spawn EPERM`, sehingga klik UI tidak dapat diotomatisasi agent.
- **Next best action:** Di jendela Rakit yang terbuka, pilih project berpesanan, Generate Invoice, lalu ekspor PNG dan PDF ke drive D. Pastikan file dapat dibuka, preview sesuai, dan nomor dokumen tetap saat digenerate ulang.

### Sesi 51 - Status ekspor Invoice akurat (2026-08-10)

- **Goal:** Melanjutkan audit fitur aktif `invoice-generate-export`.
- **Completed:** Pesan sukses ekspor PNG/JPG/PDF sekarang menyatakan file tersimpan di lokasi yang dipilih pada dialog, bukan keliru menyebut folder project.
- **Verification run:** `npm run build` lulus (3091 modul); peringatan ukuran bundle tetap tanpa error.
- **Known risks:** Verifikasi interaktif Generate serta file ekspor masih diperlukan untuk menandai fitur `passing`.
- **Next best action:** Uji Generate Invoice, Save PNG/PDF, lalu generate ulang pada project yang sama untuk mengonfirmasi nomor permanen dan file valid.

### Sesi 52 - Total Invoice satu baris (2026-08-10)

- **Goal:** Memperbaiki label Total Tagihan yang terpecah menjadi dua baris.
- **Completed:** Label dan nominal sekarang dirender sebagai satu elemen `whitespace-nowrap`: `Total Tagihan: Rp …`. Proses Tauri dev juga direstart lengkap karena jendela lama tidak lagi memiliki server Vite untuk hot reload.
- **Verification run:** `npm run build` lulus (3091 modul). Proses Vite dan `app.exe` baru terdeteksi aktif setelah restart.
- **Next best action:** Generate ulang Invoice di jendela Rakit yang baru untuk memeriksa satu baris Total Tagihan pada preview dan ekspor.

### Sesi 53 - Lebar Total Invoice adaptif (2026-08-10)

- **Goal:** Memastikan satu baris Total Tagihan tidak kembali terjepit oleh lebar blok tetap.
- **Completed:** Blok total sekarang memakai `w-fit`, mengikuti lebar kalimat `Total Tagihan: Rp …` alih-alih dibatasi `max-w-72`.
- **Verification run:** `npm run build` lulus (3091 modul).
- **Verification visual:** User mengonfirmasi tata letak Total Tagihan sudah sesuai setelah perubahan dimuat.
- **Next best action:** Lanjutkan verifikasi runtime tersisa untuk ekspor PDF dan nomor dokumen permanen sebelum `invoice-generate-export` ditandai `passing`.

### Sesi 54 - Mulai CRUD Idea (2026-08-10)

- **Goal:** Menyelesaikan `invoice-generate-export`, lalu memulai fitur aktif berikutnya `idea-crud`.
- **Completed:** Invoice ditandai `passing` setelah user mengonfirmasi PDF versi terbaru dapat disimpan dan dibuka. Untuk Idea, dibuat repository SQLite dan halaman CRUD dengan form teks, link HTTP(S), dokumen, dan gambar; kategori awal: Inspirasi, Konten, Desain, Bisnis, Pribadi. File hanya direferensikan dari lokasi lokal dan tidak ikut dihapus saat Idea dihapus.
- **Verification run:** `npm run build` lulus (3093 modul).
- **Known risks:** CRUD Idea belum diuji interaktif dalam Tauri. Pratinjau gambar bergantung pada asset protocol/scope file lokal.
- **Next best action:** Di jendela Rakit, buka Idea; tambah satu item tiap tipe, edit satu item, lalu hapus satu item. Jika semua berhasil, tandai `idea-crud` passing dan lanjut `idea-kategori`.

### Sesi 55 - Detail dan akses file Idea (2026-08-10)

- **Goal:** Melanjutkan kualitas UI dan akses lokal untuk `idea-crud`.
- **Completed:** Kartu Idea kini memiliki panel detail agar teks panjang dapat dibaca tanpa mengedit. Izin opener ditambahkan hanya untuk folder Pictures, Desktop, Documents, dan Downloads, selaras dengan asset protocol agar file Idea dari lokasi umum Windows dapat dibuka. Aplikasi dev direstart bersih setelah pembaruan capability.
- **Verification run:** `npm run build` lulus (3093 modul); `cargo check --manifest-path src-tauri/Cargo.toml` lulus.
- **Known risks:** CRUD Idea masih memerlukan uji interaktif simpan/edit/hapus untuk empat tipe konten.
- **Next best action:** Gunakan jendela Rakit yang baru untuk menambah satu item teks, dokumen, gambar, dan link; buka Detail serta file/link-nya, edit satu item, lalu hapus satu item.

### Sesi 56 - Perbaikan popup Reference di atas webview native (2026-08-11)

- **Goal:** Membuat pengaturan Reference tetap dapat dibuka saat website native sedang tampil.
- **Completed:** Webview native kini ditutup secara eksplisit sebelum Dialog Pengaturan dibuka, sehingga tidak lagi menutupi popup. Tombol Pengaturan juga tersedia di bagian bawah subsidebar Website, di luar area webview native. Penambahan link menyiarkan pembaruan agar subsidebar langsung memuat link baru.
- **Verification run:** `npm run build` lulus (3103 modul). Peringatan ukuran bundle di atas 500 kB tetap tanpa error.
- **Known risks:** Perlu uji manual di Tauri: buka Pinterest, klik Pengaturan pada subsidebar Website, lalu pastikan dialog tampil dan Pinterest hilang sebelum popup muncul.
- **Next best action:** Uji interaksi tersebut di jendela Rakit yang dimuat ulang. Setelah lolos, lengkapi manajemen hapus link pada dialog Settings Reference.

### Sesi 57 - Selesaikan Reference dan amankan Archive (2026-08-11)

- **Goal:** Menyelaraskan status fitur dengan pengujian visual user, lalu melanjutkan fitur Archive.
- **Completed:** `reference-browser-inapp` dan `reference-kategori-link` ditandai passing berdasarkan pengujian visual user: web native Pinterest/Magnific tampil, dapat dinavigasi, dan daftar link dikelompokkan berdasarkan kategori. Archive kini menolak project yang belum berstatus Selesai, memindahkan folder fisik ke `Arsip`, serta mencoba mengembalikan folder apabila update database gagal. Teks konfirmasi juga disesuaikan dengan perilaku sebenarnya.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3104 modul). Verifikasi sandbox awal gagal hanya karena `spawn EPERM` pada modul native Tailwind; build penuh lulus.
- **Known risks:** Perlu satu pengujian runtime Archive: arsipkan project berstatus Selesai, cek folder pindah ke `Arsip`, lalu gunakan Kembalikan dan pastikan folder kembali ke akar project.
- **Next best action:** Uji aksi Arsip/Kembalikan pada satu project Selesai. Setelah dikonfirmasi, tandai `archive-pindah-project` dan `archive-pindah-folder-fisik` passing, lalu lanjut Dashboard.

### Sesi 58 - Detail project di Archive (2026-08-11)

- **Goal:** Melengkapi pemeriksaan data project setelah diarsipkan.
- **Completed:** Halaman Archive memiliki aksi Detail yang membuka dialog data lengkap project: kode, klien, WhatsApp, deadline, status pembayaran, dan brief. Project tetap dapat dipulihkan atau foldernya dibuka dari tabel.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3105 modul).
- **Known risks:** Perpindahan folder Archive/restore tetap membutuhkan satu uji runtime pada project yang selesai.
- **Next best action:** Arsipkan lalu pulihkan satu project Selesai melalui UI untuk memastikan database dan folder fisik bergerak bersamaan.

### Sesi 59 - Lokasi Archive mengikuti folder asal (2026-08-11)

- **Goal:** Mencegah project lama berpindah ke akar folder baru setelah Settings diubah.
- **Completed:** Pemindahan ke Archive sekarang memakai folder induk dari project yang diarsipkan, dan pemulihan memakai induk dari folder `Arsip` tersebut. Jadi project selalu kembali ke lokasi asalnya.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3105 modul).
- **Known risks:** Tetap perlu pengujian fisik sekali lewat UI untuk memastikan izin rename folder aktif di aplikasi Tauri.
- **Next best action:** Arsipkan lalu pulihkan satu project Selesai melalui UI; jika berhasil, kedua fitur Archive dapat ditandai passing.

### Sesi 60 - Izin rename untuk Archive (2026-08-11)

- **Goal:** Memperbaiki tombol Arsip yang tidak memindahkan project.
- **Completed:** Penyebabnya adalah capability `fs:allow-rename` belum diizinkan untuk plugin filesystem Tauri. Izin ditambahkan, aplikasi Tauri direstart bersih, dan halaman Project sekarang menampilkan pesan sukses atau error Archive.
- **Verification run:** `npm run build` lulus (3105 modul); `cargo check --manifest-path src-tauri/Cargo.toml` lulus. Proses Tauri baru dan `app.exe` aktif setelah restart.
- **Known risks:** Perlu klik Arsip sekali dari UI untuk membuktikan permission berjalan pada folder project nyata.
- **Next best action:** Arsipkan satu project berstatus Selesai; pastikan proyek hilang dari daftar utama, folder pindah, dan barisnya muncul di Archive.

### Sesi 61 - Archive tetap berjalan saat folder terkunci (2026-08-11)

- **Goal:** Membuat tombol Arsip tetap berguna ketika Windows menolak rename folder tertentu.
- **Completed:** Pengujian folder sementara ke `Arsip` berhasil; khusus folder `RKT-015-merpin-2026-08-07`, Windows mengembalikan `Access is denied (os error 5)` meski ACL normal. Archive sekarang memisahkan kedua perilaku roadmap: project tetap masuk Archive dan folder lama tetap dapat dibuka, sementara pesan menjelaskan bila pemindahan folder fisik gagal. Restore tidak mencoba memindahkan folder yang memang belum berada dalam `Arsip`.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3105 modul).
- **Known risks:** Folder project RKT-015 belum dapat dipindahkan oleh proses aplikasi; kemungkinan ada lock/aturan Windows khusus pada folder tersebut yang tidak terlihat dari daftar proses.
- **Next best action:** Klik Arsip lagi untuk memastikan project muncul di halaman Archive. Untuk fitur pemindahan folder fisik, tutup aplikasi yang membuka berkas project lalu coba lagi pada project lain untuk membedakan lock folder spesifik dari aturan sistem.

### Sesi 62 - Restart bersih kode Archive terbaru (2026-08-11)

- **Goal:** Memastikan perbaikan Archive dimuat oleh aplikasi yang sedang terbuka.
- **Completed:** Tangkapan layar masih menjalankan bundle lama karena server Vite sebelumnya berhenti. Proses app lama ditutup, server Vite dan Tauri dev baru dijalankan; keduanya terdeteksi aktif.
- **Verification run:** Proses `app.exe`, Tauri dev, dan Vite port 1420 aktif setelah restart.
- **Known risks:** Pemindahan folder RKT-015 masih ditolak Windows; versi baru setidaknya mengarsipkan data project tanpa menggantung pada operasi folder.
- **Next best action:** Klik Arsip pada jendela baru; project harus menghilang dari daftar utama dan muncul di Archive dengan pesan status folder.

### Sesi 63 - Notifikasi popup global (2026-08-11)

- **Goal:** Menghilangkan pesan notifikasi yang memakan ruang pada halaman.
- **Completed:** Sonner dipasang sebagai toast global di kanan atas dan mengikuti tema terang/gelap. Notifikasi aksi Project/Archive, Brief, Invoice/Nota, ekspor dokumen, dan Pesanan dipindahkan ke popup. Pesan validasi input tetap inline agar field yang perlu diperbaiki tetap jelas.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3107 modul).
- **Known risks:** Perlu satu klik aksi Archive atau Pesanan untuk konfirmasi visual toast pada aplikasi yang terbuka.
- **Next best action:** Klik aksi Archive atau simpan Pesanan untuk memeriksa popup sukses/peringatan di kanan atas.

### Sesi 64 - Ringkas pesan popup Archive (2026-08-11)

- **Goal:** Menghilangkan detail jalur Windows yang panjang dari toast user-facing.
- **Completed:** Warning Archive kini menjelaskan langkah yang bisa dilakukan secara singkat. Error teknis lengkap hanya dicatat ke console untuk diagnosis.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3107 modul).
- **Next best action:** Coba aksi Archive kembali untuk melihat popup versi ringkas.

### Sesi 65 - Pemindahan ulang folder Archive (2026-08-11)

- **Goal:** Menjaga folder fisik tetap rapi di `Arsip` saat percobaan awal ditolak Windows.
- **Completed:** Pemindahan folder mencoba rename hingga tiga kali. Baris Archive yang foldernya masih berada di lokasi lama sekarang memiliki aksi `Pindahkan Folder`; aksi ini memperbarui path database setelah berhasil dan menampilkan toast sukses/gagal. Restore aman untuk project yang foldernya belum berpindah.
- **Verification run:** `npm run build` lulus (3107 modul); `cargo check --manifest-path src-tauri/Cargo.toml` lulus.
- **Known risks:** RKT-015 masih memerlukan klik `Pindahkan Folder` setelah memastikan tidak ada aplikasi yang memegang file dalam folder tersebut.
- **Next best action:** Buka Archive lalu klik `Pindahkan Folder` pada RKT-015; bila Windows melepas lock, folder langsung masuk ke `Arsip`.

### Sesi 66 - Sidebar Keuangan dan Invoice langsung (2026-08-11)

- **Goal:** Menghilangkan submenu Finance dari navigasi.
- **Completed:** `Keuangan` dan `Invoice / Nota` kini masing-masing menjadi menu utama sejajar dengan Project di sidebar.
- **Verification run:** `npm run build` lulus di lingkungan Windows penuh (3107 modul).
- **Next best action:** Lanjutkan verifikasi Archive folder fisik atau lanjut fitur roadmap berikutnya setelah user mengonfirmasi.

### Sesi 67 - Identitas logo Rakit baru (2026-08-11)

- **Goal:** Memakai logo baru yang diberikan user pada sidebar aplikasi dan paket instalasi.
- **Completed:** Aset logo transparan disimpan di `public/branding/rakit-logo.png`, logo teks `R` pada sidebar diganti dengan aset tersebut, dan seluruh ikon bundle Tauri dibuat ulang (`.ico`, `.icns`, PNG, serta icon Windows Store) dari logo baru. Paket installer Windows versi 0.1.5 juga dibangun ulang dengan ikon tersebut.
- **Verification run:** `npm run build` lulus (3107 modul). Artefak installer terbaru terdeteksi: `src-tauri/target/release/bundle/msi/Rakit_0.1.5_x64_en-US.msi` dan `src-tauri/target/release/bundle/nsis/Rakit_0.1.5_x64-setup.exe` dengan waktu build 2026-08-11.
- **Known risks:** Ikon pada aplikasi Rakit yang sedang berjalan dan ikon shortcut Windows lama dapat tersimpan di cache Windows; aplikasi perlu ditutup lalu installer baru dijalankan agar shortcut memakai ikon baru.
- **Next best action:** Tutup Rakit, jalankan installer versi baru, lalu pastikan ikon di desktop/Start serta logo sidebar berubah.

# 🏛️ SIMPA v1.0.0 — Sistem Informasi Manajemen Pemuda Persis / HIPPA

> **Dokumen Resmi Ikhtisar Proyek (Project Overview)** untuk rilis **v1.0.0**.  
> Dirancang sebagai panduan komprehensif bagi developer dan AI Agent untuk memahami arsitektur, seluruh fitur, skema basis data, integrasi WhatsApp Gateway, dan alur kerja teknis.

---

## 📌 Ringkasan Proyek

**SIMPA** (*Sistem Informasi Manajemen Pengurus dan Anggota*) adalah platform web manajemen organisasi terpadu yang dibangun untuk **Pimpinan Jamaah (PJ) Pemuda Persis / HIPPA (Himpunan Pelajar Persatuan Islam Putra) Cirengit**. 

Aplikasi ini menyatukan administrasi organisasi secara digital dan terpusat:
- Pendataan dan riwayat anggota organisasi lengkap dengan penerbitan Kartu Tanda Anggota (KTA).
- Struktur kepengurusan (Tasykil), Pimpinan Harian (Pimhar), Dewan Penasehat, dan Bidang kerja.
- Manajemen calon anggota/pendaftar baru dan verifikasi keanggotaan.
- Agenda dan kalender kegiatan organisasi terintegrasi.
- Otomasi notifikasi broadcast via **WhatsApp Gateway** mandiri.
- Pembukuan keuangan kas organisasi yang aman dengan proteksi PIN dan OTP.
- Pusat panduan pengguna publik terintegrasi (**SIMPA Wiki**).

| Informasi | Spesifikasi |
|-----------|-------------|
| **Nama Proyek** | SIMPA (Sistem Informasi Manajemen Pengurus dan Anggota) |
| **Versi Rilis** | `v1.0.0` |
| **Organisasi Pengguna** | PJ Pemuda Persis / HIPPA Cirengit |
| **Framework Utama** | Next.js 16.3.1 (App Router), React 19.2.8, TypeScript 5 |
| **Database & ORM** | PostgreSQL (Supabase) via Prisma ORM 7.9.1 |
| **Styling & UI** | Tailwind CSS v4, Shadcn/UI, Base UI, Lucide Icons, Material Symbols |
| **Layanan Pesan** | WhatsApp Gateway Service (`whatsapp-web.js`) & Nodemailer (SMTP) |
| **Pola Arsitektur** | Feature-Driven Architecture + Clean Architecture Principles |

---

## 🗂️ Struktur Direktori Proyek

```
simpa/
├── src/
│   ├── app/                          # Next.js App Router (Routing, Pages, Route Handlers)
│   │   ├── (auth)/                   # Alur Autentikasi
│   │   │   ├── login/                # Halaman login multi-role
│   │   │   ├── daftar/               # Halaman pendaftaran mandiri
│   │   │   ├── forgot-password/      # Permintaan reset password
│   │   │   └── reset-password/       # Form reset password dengan token
│   │   ├── dashboard/                # Portal Utama Manajemen Organisasi
│   │   │   ├── page.tsx              # Ringkasan statistik & Recent Logins audit
│   │   │   ├── data-anggota/         # Manajemen anggota & cetak KTA (single & massal)
│   │   │   ├── tasykil/              # Struktur organisasi (Pimhar & Bidang)
│   │   │   ├── calon-anggota/        # Verifikasi pendaftar baru
│   │   │   ├── jadwal-kegiatan/      # Kalender & antrean notifikasi kegiatan
│   │   │   ├── keuangan/             # Pembukuan kas, kategori, & modal PIN/OTP
│   │   │   ├── pengaturan-wa/        # Status bot WhatsApp & scan QR gateway
│   │   │   ├── role-akses/           # Konfigurasi granular hak akses RBAC
│   │   │   ├── pengaturan-sistem/    # Pengaturan global & penandatangan KTA
│   │   │   └── profil/               # Profil pengguna aktif & ganti sandi
│   │   ├── wiki/                     # Buku Panduan Pengguna Interaktif (SIMPA Wiki)
│   │   ├── api/                      # Route Handlers (API RESTful internal)
│   │   │   ├── db-sync/              # Sinkronisasi dua arah Prisma Supabase & cache
│   │   │   ├── kas/                  # API transaksi, kategori, verifikasi & reset PIN
│   │   │   ├── kegiatan/             # API pengelolaan kegiatan & trigger broadcast
│   │   │   ├── cron/                 # Background job pengirim pesan WA otomatis
│   │   │   ├── check-wa/             # Monitoring status koneksi WhatsApp
│   │   │   ├── send-wa/              # Pengiriman pesan teks/notifikasi WA
│   │   │   ├── restart-wa/           # Restart service bot WA
│   │   │   ├── logout-wa/            # Disconnect sesi aktif bot WA
│   │   │   ├── send-email-welcome/   # Pengiriman email konfirmasi pendaftaran
│   │   │   ├── upload-photo/         # Handler upload foto profil anggota
│   │   │   └── upload-asset/         # Handler upload aset gambar/tanda tangan
│   │   ├── layout.tsx                # Root layout Next.js
│   │   └── page.tsx                  # Public Portal / Landing Page utama
│   │
│   ├── modules/                      # Business Domain (Feature Driven)
│   │   ├── auth/                     # Use-cases, schemas, repositories auth
│   │   ├── calon-anggota/            # Logika bisnis data pendaftar
│   │   └── kegiatan/                 # Logika bisnis agenda & notifikasi
│   │
│   ├── common/                       # Kode Reusable Lintas Fitur
│   │   ├── components/               # Dialog-provider, export-dropdown, dll
│   │   └── lib/                      # auth.ts, mock-db.ts, alert.tsx, whatsapp-service.ts
│   │
│   ├── components/                   # Komponen Presentasional & UI
│   │   ├── ui/                       # Komponen atomik Shadcn/UI (button, card, dialog, dll)
│   │   ├── app-sidebar.tsx           # Sidebar navigasi dashboard dinamis sesuai role
│   │   ├── KtaCard.tsx               # Preview & template Kartu Tanda Anggota
│   │   └── login-form.tsx            # Form login dengan proteksi & resolusi role
│   │
│   ├── infrastructure/
│   │   └── prisma/                   # Prisma Client Singleton Instance
│   ├── types/                        # Definisi tipe global TypeScript
│   └── lib/                          # Helper utilitas UI (cn utils)
│
├── prisma/
│   ├── schema.prisma                 # Definisi skema lengkap PostgreSQL
│   └── seed.ts                       # Script seeding awal (Role, Akun, Data master)
│
├── whatsapp-gateway-new/             # Service Mandiri WhatsApp Gateway
│   ├── server.js                     # Server Node.js (Express + whatsapp-web.js)
│   ├── package.json                  # Dependencies bot WA
│   └── ecosystem.config.js           # Konfigurasi process manager PM2
│
└── public/                           # Aset statis (logo, template gambar KTA, icon)
```

---

## 🖥️ Katalog Fitur & Modul Lengkap (v1.0.0)

### 1. Portal Publik & Edukasi
- **Landing Page (`/`)**: Menampilkan identitas resmi organisasi HIPPA/Pemuda Persis Cirengit, hitung mundur kegiatan terdekat, pengumuman agenda, dan navigasi cepat.
- **SIMPA Wiki / Buku Panduan (`/wiki`)**: Dokumentasi panduan operasional interaktif untuk anggota dan pengurus agar dapat mengoperasikan sistem secara mandiri.
- **Autentikasi Terpadu**:
  - `/login`: Autentikasi dengan NPA (*Nomor Pokok Anggota*) atau username khusus (`26.0000` untuk Super Admin). Mendeteksi otomatis jabatan tasykil/pimhar dari database.
  - `/daftar`: Registrasi calon anggota baru dari halaman publik.
  - `/forgot-password` & `/reset-password`: Mekanisme pemulihan akun melalui token yang dikirimkan ke alamat email.

### 2. Dashboard & Manajemen Keorganisasian
- **Beranda Dashboard (`/dashboard`)**:
  - Kartu metrik total anggota (aktif, tidak aktif, alumni), total kas organisasi, dan pendaftar baru.
  - Widget grafik tren keanggotaan dan kas bulanan.
  - Audit trail **Recent Users Login** untuk memantau aktivitas sesi pengurus terkini.
- **Data Anggota (`/dashboard/data-anggota`)**:
  - Tabel master data anggota dengan pagination, filter status, dan pencarian cepat.
  - Form penambahan dan pengubahan profil detail (biodata, kontak, riwayat wilayah, dan foto profil).
  - Ekspor dan impor data ke format Microsoft Excel (.xlsx).
  - **Generator KTA (Kartu Tanda Anggota)**:
    - *KTA Individual* (`/kta/[id]`): Cetak dan unduh KTA presisi tinggi dengan QR code verifikasi data.
    - *KTA Massal* (`/kta-massal`): Pembuatan dokumen PDF berisi seluruh kartu anggota siap cetak menggunakan `jspdf` dan `sharp`.
- **Tasykil Kepengurusan (`/dashboard/tasykil`)**:
  - Pemetaan dewan penasehat.
  - Pimpinan Harian (Pimhar): Ketua, Wakil Ketua, Sekretaris, Wakil Sekretaris, Bendahara, Wakil Bendahara.
  - Manajemen Bidang Kerja: Menambah divisi dan memetakan anggota ke dalam bidang masing-masing.
- **Calon Anggota (`/dashboard/calon-anggota`)**:
  - Peninjauan berkas calon anggota yang mendaftar secara online.
  - Pengubahan status pelamar: `Menunggu`, `Proses`, `Diterima`, atau `Ditolak`.
  - Notifikasi otomatis konfirmasi penerimaan melalui email dan WhatsApp.
- **Jadwal Kegiatan (`/dashboard/jadwal-kegiatan`)**:
  - Kalender kegiatan responsif dengan kode warna per kategori acara (Kajian, Musyawarah, Kaderisasi, Sosial, Rapat).
  - Form pembuatan kegiatan lengkap dengan waktu, lokasi, pemateri, dan deskripsi tema.
  - Fitur penjadwalan antrean notifikasi broadcast kegiatan kepada seluruh pengurus dan anggota.

### 3. Keuangan & Kas Organisasi (`/dashboard/keuangan`)
- Pencatatan transaksi Kas Masuk (*Pemasukan*) dan Kas Keluar (*Pengeluaran*).
- Manajemen kategori kas yang dapat disesuaikan (Custom Kategori).
- Penghitungan saldo berjalan, rekap bulanan, dan ekspor laporan keuangan kas.
- **Sistem Keamanan Ganda Kas**:
  - Pembatasan akses melihat dan mengelola modul kas melalui izin khusus di RBAC.
  - Proteksi PIN keamanan transaksi kas.
  - Alur darurat *Forgot PIN* dengan pengiriman 6-digit kode OTP ke email terdaftar pengurus sebelum PIN baru diatur ulang.

### 4. WhatsApp Gateway & Auto Broadcast (`/dashboard/pengaturan-wa`)
- Service latar belakang mandiri (*microservice*) menggunakan Node.js dan `whatsapp-web.js`.
- Scan QR code langsung dari UI dashboard untuk menghubungkan akun WhatsApp bot.
- Manajemen status bot (koneksi, restart gateway, dan logout sesi).
- Sistem antrean pesan (`WaQueue`) untuk mencegah nomor WhatsApp terblokir (*anti-ban pacing/throttling*).
- Jadwal broadcast otomatis (H-3, H-1, dan hari-H kegiatan) via cron job endpoint (`/api/cron/send-daily-wa`).

### 5. Keamanan & Konfigurasi Sistem
- **Role & Hak Akses Granular (`/dashboard/role-akses`)**:
  Sistem Role-Based Access Control (RBAC) dengan 14 izin kontrol spesifik:
  1. `allowDashboard` — Akses beranda dashboard.
  2. `viewDataAnggota` & `manageDataAnggota` — Izin baca/tulis data anggota.
  3. `viewTasykil` & `manageTasykil` — Izin baca/tulis struktur kepengurusan.
  4. `viewCalonAnggota` & `manageCalonAnggota` — Izin baca/tulis pendaftar.
  5. `viewJadwalKegiatan` & `manageJadwalKegiatan` — Izin baca/tulis jadwal.
  6. `viewPengaturan` & `managePengaturan` — Izin pengaturan sistem.
  7. `viewKeuangan` & `manageKeuangan` — Izin baca/tulis kas & keuangan.
- **Pengaturan Sistem (`/dashboard/pengaturan-sistem`)**:
  - Pengaturan penandatangan KTA (Nama Ketua, NPA Ketua, dan unggah berkas tanda tangan digital).
  - Pengaturan global nama organisasi dan parameter sistem.
- **Profil Pengguna (`/dashboard/profil`)**:
  - Pembaruan informasi akun login, email pemulihan, dan penggantian password.

---

## 🗄️ Skema Basis Data (Prisma ORM)

```
                 ┌──────────────┐
                 │  RoleAkses   │
                 └──────┬───────┘
                        │ 1
                        │
                        │ *
┌──────────────┐ 1    1 ┌┴─────────────┐
│   Anggota    ├────────┤  AkunLogin   │
└──┬────┬────┬─┘        └──────────────┘
   │    │    │
   │    │    └─ 1:1 ─── Pimhar (Peran 6 Jabatan Utama)
   │    │
   │    └────── 1:1 ─── AnggotaBidang ── * : 1 ── Bidang
   │
   └─────────── (Relasi logis: Pemohon, Data Cetak KTA)

[Tabel Penunjang Administrasi]
├── Penasehat            (Daftar Dewan Penasehat & Urutan Tampil)
├── KtaSettings          (Konfigurasi Penandatangan & TTD KTA)
├── Applicant            (Calon Anggota Baru)
├── SystemSetting        (Key-Value Global Settings)

[Tabel Kegiatan & Otomasi WA]
├── ScheduledEvent       (Jadwal & Agenda Kegiatan)
├── WaQueue              (Antrean Pesan Siap Kirim WhatsApp)
└── WaTemplate           (Template Pesan WhatsApp Dinamis)

[Tabel Keuangan Kas]
├── KasTransaksi         (Data Mutasi Debet / Kredit Kas)
├── KasKategori          (Master Kategori Pemasukan / Pengeluaran)
└── KasSetting           (Saldo Awal Organisasi & PIN Proteksi Transaksi)
```

---

## 🔌 Daftar Lengkap API Endpoints

| Grup | Endpoint | Method | Fungsi / Deskripsi |
|------|----------|--------|---------------------|
| **Sinkronisasi** | `/api/db-sync` | `GET`, `POST` | Sinkronisasi data antara cache lokal dan Supabase PostgreSQL |
| **Kegiatan** | `/api/kegiatan` | `GET`, `POST`, `PUT`, `DELETE` | Operasi CRUD master jadwal kegiatan |
| | `/api/kegiatan/[id]/notify` | `POST` | Memasukkan agenda ke antrean pesan broadcast WA |
| **WhatsApp** | `/api/check-wa` | `GET` | Memeriksa status koneksi QR / Client WhatsApp Gateway |
| | `/api/send-wa` | `POST` | Mengirim pesan WhatsApp instan ke nomor tujuan |
| | `/api/logout-wa` | `POST` | Memutus sesi login WhatsApp aktif |
| | `/api/restart-wa` | `POST` | Merestart proses service WhatsApp Gateway |
| | `/api/cron/send-daily-wa` | `GET`, `POST` | Job terjadwal untuk broadcast pengingat kegiatan harian |
| | `/api/cron/process-queue` | `GET`, `POST` | Menjalankan eksekusi pengiriman antrean pesan tertunda |
| **Keuangan** | `/api/kas/transaksi` | `GET`, `POST` | Mengambil riwayat dan mencatat transaksi kas |
| | `/api/kas/transaksi/[id]` | `PUT`, `DELETE` | Memperbarui atau menghapus transaksi kas tertentu |
| | `/api/kas/kategori` | `GET`, `POST` | Mengelola master kategori keuangan |
| | `/api/kas/kategori/[id]` | `PUT`, `DELETE` | Mengubah atau menghapus kategori keuangan |
| | `/api/kas/setting` | `GET`, `POST` | Mengambil dan memperbarui konfigurasi saldo awal kas |
| | `/api/kas/set-pin` | `POST` | Mengatur PIN baru untuk keamanan modul kas |
| | `/api/kas/verify-pin` | `POST` | Memvalidasi input PIN sebelum membuka data/transaksi kas |
| | `/api/kas/request-pin-otp`| `POST` | Mengirimkan kode OTP reset PIN kas ke email pengurus |
| | `/api/kas/reset-pin-via-otp`| `POST` | Mereset PIN kas menggunakan verifikasi OTP |
| **Aset & Notifikasi** | `/api/upload-photo` | `POST` | Mengunggah dan mengompres foto profil anggota |
| | `/api/upload-asset` | `POST` | Mengunggah file aset KTA / tanda tangan |
| | `/api/send-email-welcome` | `POST` | Mengirim email notifikasi pendaftaran calon anggota |

---

## 🏗️ Prinsip & Konvensi Arsitektur (AI Coding Guide)

Untuk AI atau pengembang berikutnya yang memodifikasi basis kode SIMPA, patuhi aturan baku berikut:

1. **Feature Driven Architecture**:
   - Kode fitur bisnis berada di dalam `src/modules/<nama-fitur>/`.
   - Pisahkan layer secara tegas: `actions/` → `use-cases/` → `repositories/` → `schemas/`.
2. **1 File = 1 Tanggung Jawab**:
   - Satu use-case per file (`create-anggota.use-case.ts`).
   - Satu schema per file (`create-anggota.schema.ts`).
   - Hindari membuat *God class* atau *God service*.
3. **Aturan Akses Database (Prisma)**:
   - **Prisma HANYA boleh dipanggil di dalam layer Repository (`*.repository.ts`)**.
   - Dilarang keras melakukan import `prisma` di dalam `page.tsx`, `components`, atau `actions`.
4. **Validasi Skema**:
   - Seluruh input dari client atau Server Actions wajib divalidasi menggunakan **Zod**.
5. **Database Sync Rule**:
   - Jika menambah atau mengubah atribut entitas data di antarmuka/mock-db, pastikan model di `prisma/schema.prisma` diperbarui, jalankan `npx prisma db push`, dan perbarui handler di `src/app/api/db-sync/route.ts`.
6. **Penamaan File**:
   - Gunakan format konsisten `kebab-case` untuk semua nama file dan folder.

---

## 🚀 Panduan Menjalankan Sistem

### 1. Prasyarat Lingkungan
- Node.js versi 20 atau yang lebih baru.
- Akun PostgreSQL (misal: Supabase) dengan Connection Pooling & Direct URL.
- Akun SMTP Email (misal: Gmail App Password) untuk fitur OTP dan notifikasi.
- Chromium / Google Chrome terpasang di sistem (untuk WhatsApp Gateway Puppeteer).

### 2. Instalasi & Setup Aplikasi Web (SIMPA)
```bash
# 1. Masuk ke direktori utama
cd simpa

# 2. Salin variabel lingkungan
cp .env.example .env.local

# 3. Pasang dependensi
npm install

# 4. Generate Prisma Client
npx prisma generate

# 5. Sinkronisasi skema ke database
npx prisma db push

# 6. Jalankan dev server
npm run dev
```
> Aplikasi web dapat diakses melalui peramban di: `http://localhost:3000`

### 3. Menjalankan WhatsApp Gateway Service
```bash
# 1. Masuk ke sub-direktori gateway
cd whatsapp-gateway-new

# 2. Pasang dependensi gateway
npm install

# 3. Jalankan service (mode dev)
npm start

# Atau jalankan via PM2 untuk production:
pm2 start ecosystem.config.js
```
> Service gateway akan berjalan di port `3001` (atau sesuai konfigurasi env) dan siap dihubungkan melalui menu `/dashboard/pengaturan-wa` di aplikasi SIMPA.

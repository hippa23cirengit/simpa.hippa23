# 🏛️ SIMPA — Sistem Informasi Manajemen Pemuda Persis

> **Sistem Informasi Manajemen** untuk **Pemuda Persis Cirengit**  
> Dibangun dengan Next.js 16, Prisma ORM, PostgreSQL (Supabase), dan WhatsApp Gateway

---

## 📌 Gambaran Umum

**SIMPA** adalah aplikasi web manajemen organisasi yang dirancang khusus untuk **Pimpinan Jamaah (PJ) Pemuda Persis Cirengit**. Aplikasi ini mengelola seluruh data administrasi organisasi dalam satu platform terintegrasi — mulai dari data keanggotaan, struktur kepengurusan, jadwal kegiatan, keuangan, hingga notifikasi WhatsApp otomatis.

| Info | Detail |
|------|--------|
| **Nama Project** | SIMPA (Sistem Informasi Manajemen Pemuda Persis) |
| **Organisasi** | PJ Pemuda Persis Cirengit |
| **Stack Utama** | Next.js 16.3.1, React 19, TypeScript, Prisma 7, PostgreSQL |
| **Hosting/DB** | Vercel (deployment) + Supabase (database PostgreSQL) |
| **Arsitektur** | Feature Driven Architecture + Clean Architecture |

---

## 🗂️ Struktur Project

```
simpa/
├── src/
│   ├── app/                    # App Router — routing & page composition
│   │   ├── (auth)/             # login, daftar, forgot/reset password
│   │   ├── dashboard/          # semua halaman dashboard
│   │   └── api/                # Route Handlers (API endpoints)
│   ├── modules/                # Fitur bisnis (Feature Driven)
│   │   ├── auth/               # Autentikasi & session
│   │   ├── calon-anggota/      # Manajemen pendaftar baru
│   │   └── kegiatan/           # Manajemen jadwal kegiatan
│   ├── common/                 # Kode reusable lintas fitur
│   │   ├── components/         # dialog-provider, export-dropdown
│   │   └── lib/                # auth.ts, mock-db.ts, alert.tsx, whatsapp-service.ts
│   ├── components/             # UI Components (shadcn/ui + custom)
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── app-sidebar.tsx     # Sidebar navigasi
│   │   ├── KtaCard.tsx         # Kartu Tanda Anggota (KTA)
│   │   ├── login-form.tsx      # Form login
│   │   └── ...
│   ├── infrastructure/
│   │   └── prisma/             # Prisma client singleton
│   ├── lib/                    # Utilitas global
│   └── types/                  # TypeScript global types
├── prisma/
│   ├── schema.prisma           # Skema database
│   └── seed.ts                 # Data awal (seed)
├── whatsapp-gateway-new/       # WhatsApp Gateway (Node.js + whatsapp-web.js)
│   └── server.js               # Server WA gateway
└── public/                     # Aset publik (gambar, font, dll)
```

---

## 🖥️ Halaman & Fitur

### 🔐 Autentikasi
| Halaman | Path | Keterangan |
|---------|------|------------|
| Login | `/login` | Login dengan NPA + password |
| Daftar | `/daftar` | Pendaftaran akun baru |
| Lupa Password | `/forgot-password` | Request reset via email |
| Reset Password | `/reset-password` | Atur ulang password via token |

### 📊 Dashboard
| Halaman | Path | Keterangan |
|---------|------|------------|
| Beranda | `/dashboard` | Ringkasan statistik & info terkini |
| Data Anggota | `/dashboard/data-anggota` | CRUD anggota + cetak KTA |
| KTA Individual | `/dashboard/data-anggota/kta` | Generate KTA satu anggota |
| KTA Massal | `/dashboard/data-anggota/kta-massal` | Generate KTA semua anggota (PDF) |
| Tasykil | `/dashboard/tasykil` | Struktur kepengurusan & bidang |
| Calon Anggota | `/dashboard/calon-anggota` | Manajemen pendaftar keanggotaan |
| Jadwal Kegiatan | `/dashboard/jadwal-kegiatan` | Kalender & daftar kegiatan |
| Keuangan | `/dashboard/keuangan` | Kas masuk/keluar + laporan |
| Pengaturan WA | `/dashboard/pengaturan-wa` | Konfigurasi WhatsApp Gateway |
| Pengaturan Sistem | `/dashboard/pengaturan-sistem` | Pengaturan umum sistem |
| Role & Akses | `/dashboard/role-akses` | Manajemen hak akses per role |
| Profil | `/dashboard/profil` | Profil akun pengguna |

---

## 🗄️ Database Schema

### Model Utama

```
Anggota ─────────── AkunLogin ─────────── RoleAkses
    │                                         │
    ├── AnggotaBidang ── Bidang               └── permissions (14 kolom)
    ├── Pimhar (kepengurusan inti)
    └── KtaSettings (pengaturan KTA)

Applicant            ScheduledEvent ── WaQueue
KasTransaksi         WaTemplate       SystemSetting
KasKategori          KasSetting (PIN keuangan)
Penasehat
```

### Deskripsi Model

| Model | Keterangan |
|-------|------------|
| `Anggota` | Data lengkap anggota (NPA, nama, alamat, kontak, dll) |
| `AkunLogin` | Akun login (NPA = username, bcrypt password, role) |
| `RoleAkses` | 14 permission flags per role (view/manage per fitur) |
| `Pimhar` | Pimpinan Harian — 6 jabatan inti organisasi |
| `Bidang` | Divisi/bidang dalam organisasi |
| `AnggotaBidang` | Relasi many-to-one anggota ke bidang |
| `Penasehat` | Daftar dewan penasehat |
| `KtaSettings` | Konfigurasi KTA (nama ketua, tanda tangan) |
| `ScheduledEvent` | Jadwal kegiatan organisasi |
| `WaQueue` | Antrian pengiriman notifikasi WhatsApp |
| `WaTemplate` | Template pesan WhatsApp |
| `Applicant` | Calon anggota yang mendaftar |
| `KasTransaksi` | Transaksi keuangan kas organisasi |
| `KasKategori` | Kategori transaksi kas |
| `KasSetting` | Pengaturan saldo awal + PIN keamanan kas |
| `SystemSetting` | Key-value store pengaturan sistem |

---

## 🔌 API Endpoints

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/db-sync` | GET | Sinkronisasi data dari Supabase ke localStorage |
| `/api/kas` | GET/POST/PUT/DELETE | CRUD transaksi & kategori keuangan |
| `/api/kegiatan` | GET/POST/PUT/DELETE | CRUD jadwal kegiatan |
| `/api/check-wa` | GET | Cek status koneksi WhatsApp |
| `/api/send-wa` | POST | Kirim pesan WhatsApp |
| `/api/logout-wa` | POST | Logout sesi WhatsApp |
| `/api/restart-wa` | POST | Restart WhatsApp Gateway |
| `/api/upload-photo` | POST | Upload foto profil anggota |
| `/api/upload-asset` | POST | Upload aset (tanda tangan KTA, dll) |
| `/api/cron` | GET | Cron job otomatis (notifikasi kegiatan) |

---

## 📦 Tech Stack & Dependencies

### Core Framework
| Paket | Versi | Fungsi |
|-------|-------|--------|
| `next` | 16.3.1 | Full-stack React framework |
| `react` | 19.2.8 | UI library |
| `typescript` | ^5 | Type safety |
| `tailwindcss` | ^4 | Styling |

### Database & ORM
| Paket | Versi | Fungsi |
|-------|-------|--------|
| `prisma` | ^7.9.1 | ORM & migration |
| `@prisma/client` | ^7.9.1 | Database client |
| `@prisma/adapter-pg` | ^7.9.1 | PostgreSQL adapter |
| `pg` | ^8.23.0 | PostgreSQL driver |

### UI Components
| Paket | Versi | Fungsi |
|-------|-------|--------|
| `shadcn` | ^4.18.0 | Component library (shadcn/ui) |
| `@base-ui/react` | ^1.7.0 | Headless UI primitives |
| `lucide-react` | ^1.32.0 | Icon library |
| `recharts` | ^3.8.0 | Chart & grafik |

### Utilitas
| Paket | Versi | Fungsi |
|-------|-------|--------|
| `bcrypt` | ^6.0.0 | Hashing password |
| `nodemailer` | ^9.0.5 | Kirim email (reset password) |
| `jspdf` + `jspdf-autotable` | latest | Generate PDF (KTA, laporan) |
| `xlsx` | ^0.18.5 | Import/export data Excel |
| `react-qr-code` | ^2.2.0 | Generate QR code untuk KTA |
| `zod` | ^4.4.3 | Validasi schema |
| `sharp` | ^0.35.3 | Optimasi gambar |

---

## 📱 WhatsApp Gateway

Sub-project terpisah (`whatsapp-gateway-new/`) yang berjalan sebagai service mandiri:

- **Runtime**: Node.js + `whatsapp-web.js`
- **Fungsi**: Mengirim notifikasi WhatsApp otomatis untuk jadwal kegiatan
- **Manajemen**: PM2 (`ecosystem.config.js`) untuk production
- **Flow**: SIMPA → `WaQueue` (DB) → Cron job → WA Gateway → WhatsApp

---

## 🔐 Sistem Role & Akses

SIMPA menggunakan **Role-Based Access Control (RBAC)** dengan 14 permission granular:

| Permission | Keterangan |
|-----------|------------|
| `allowDashboard` | Akses beranda dashboard |
| `viewDataAnggota` / `manageDataAnggota` | Lihat/kelola data anggota |
| `viewTasykil` / `manageTasykil` | Lihat/kelola struktur kepengurusan |
| `viewCalonAnggota` / `manageCalonAnggota` | Lihat/kelola pendaftar baru |
| `viewJadwalKegiatan` / `manageJadwalKegiatan` | Lihat/kelola jadwal kegiatan |
| `viewPengaturan` / `managePengaturan` | Lihat/kelola pengaturan sistem |
| `viewKeuangan` / `manageKeuangan` | Lihat/kelola data keuangan |

---

## 🏗️ Arsitektur

Project mengikuti **Feature Driven Architecture** + **Clean Architecture** dengan dependency flow yang ketat:

```
Page / Route Handler
        ↓
    Action (Server Action)
        ↓
    Use Case (business logic)
        ↓
    Repository (data access)
        ↓
    Prisma Client
        ↓
    PostgreSQL (Supabase)
```

### Prinsip Utama
- ✅ **1 File = 1 Responsibility** — satu use-case per file
- ✅ **Server Components First** — default server component, client hanya jika diperlukan
- ✅ **Prisma hanya di Repository** — tidak ada akses DB langsung di page/component
- ✅ **Validasi dengan Zod** — satu schema per use-case
- ✅ **kebab-case** — konvensi penamaan seluruh file

---

## 🚀 Cara Menjalankan

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env .env.local
# Edit .env.local dengan kredensial Supabase & konfigurasi lainnya

# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Jalankan development server
npm run dev
```

> Akses di: **http://localhost:3000**

---

## 📁 File Konfigurasi Penting

| File | Keterangan |
|------|------------|
| `.env` | Variabel environment (database URL, secrets) |
| `prisma/schema.prisma` | Skema database lengkap |
| `next.config.ts` | Konfigurasi Next.js |
| `package.json` | Dependencies & scripts |
| `AGENTS.md` | Aturan arsitektur untuk AI coding agent |
| `vercel.json` | Konfigurasi deployment Vercel |
| `whatsapp-gateway-new/server.js` | Server WhatsApp Gateway |

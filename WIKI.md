# 🏛️ Wiki SIMPA (Sistem Informasi Manajemen Pengurus dan Anggota) - Versi 1.0

Selamat datang di Wiki resmi **SIMPA** versi 1.0. Dokumen ini menjelaskan secara rinci seluruh fitur yang tersedia dalam aplikasi manajemen organisasi HIPPA.

---

## 🔐 1. Manajemen Autentikasi & Akun
Sistem keamanan dan akses masuk pengguna ke dalam aplikasi.

*   **Login (`/login`)**: Akses masuk menggunakan Nomor Pokok Anggota (NPA) sebagai *username* dan password.
*   **Pendaftaran (`/daftar`)**: Form bagi pendaftar baru untuk membuat akun.
*   **Lupa Password (`/forgot-password`)**: Fitur untuk meminta pengaturan ulang password yang akan dikirimkan melalui email.
*   **Reset Password (`/reset-password`)**: Halaman untuk mengatur ulang password menggunakan token unik dari email.

---

## 📊 2. Dashboard Beranda (`/dashboard`)
Halaman utama setelah login yang memberikan ringkasan (overview) mengenai kondisi organisasi. Menampilkan statistik penting dan informasi terkini secara sekilas.

---

## 👥 3. Manajemen Data Anggota (`/dashboard/data-anggota`)
Pusat pengelolaan data seluruh anggota organisasi.

*   **CRUD Data Anggota**: Tambah, baca, ubah, dan hapus profil lengkap anggota (NPA, nama, alamat, kontak, dll).
*   **Upload Foto Profil**: Fitur untuk mengunggah dan menyimpan foto anggota.
*   **Cetak KTA Individual (`/dashboard/data-anggota/kta`)**: Menghasilkan Kartu Tanda Anggota (KTA) lengkap dengan QR Code untuk satu anggota spesifik.
*   **Cetak KTA Massal (`/dashboard/data-anggota/kta-massal`)**: *Generate* KTA seluruh anggota ke dalam format dokumen PDF untuk dicetak sekaligus.

---

## 🏢 4. Tasykil & Kepengurusan (`/dashboard/tasykil`)
Pengelolaan struktur organisasi kepengurusan.

*   **Pimpinan Harian (Pimhar)**: Pengelolaan 6 jabatan inti dalam organisasi (Ketua, Sekretaris, Bendahara, dll).
*   **Manajemen Bidang/Divisi**: Pembuatan dan pengelolaan bidang-bidang kerja.
*   **Penempatan Anggota Bidang**: Memasukkan anggota ke dalam bidang-bidang spesifik.
*   **Dewan Penasehat**: Pencatatan daftar dewan penasehat organisasi.

---

## 📝 5. Manajemen Calon Anggota (`/dashboard/calon-anggota`)
Fitur untuk memproses pendaftar (applicant) baru yang ingin bergabung menjadi anggota resmi organisasi. Terdapat proses review dan persetujuan (approval).

---

## 📅 6. Jadwal & Kegiatan (`/dashboard/jadwal-kegiatan`)
Pengelolaan agenda organisasi yang terintegrasi dengan pengingat otomatis.

*   **Manajemen Jadwal**: Pembuatan kalender kegiatan, rapat, atau acara organisasi.
*   **Notifikasi WhatsApp Otomatis**: Integrasi dengan WA Gateway untuk mengirimkan pesan pengingat kegiatan kepada anggota sesuai antrian (melalui *cron job* dan *WaQueue*).

---

## 💰 7. Manajemen Keuangan & Kas (`/dashboard/keuangan`)
Pencatatan sirkulasi keuangan organisasi secara transparan.

*   **Transaksi Kas**: Pencatatan uang masuk dan uang keluar.
*   **Kategori Transaksi**: Pengelompokan transaksi untuk memudahkan pelaporan (misal: iuran, donasi, operasional).
*   **Laporan Keuangan**: Ringkasan dan rekapitulasi data keuangan (export tersedia).
*   **Keamanan PIN (Kas Setting)**: Pengaturan saldo awal dan perlindungan akses transaksi dengan PIN khusus.

---

## 📱 8. Pengaturan WhatsApp Gateway (`/dashboard/pengaturan-wa`)
Pusat kendali untuk bot/layanan WhatsApp notifikasi.

*   **Cek Status Koneksi**: Melihat apakah WA Gateway aktif dan terhubung.
*   **Manajemen Sesi (Logout/Restart)**: Merestart service Node.js atau memutuskan sesi WA jika diperlukan.
*   **Manajemen Template Pesan**: Mengatur format (*template*) pesan WA yang akan dikirim otomatis.

---

## ⚙️ 9. Pengaturan Sistem (`/dashboard/pengaturan-sistem`)
Pengaturan *environment* dan preferensi umum dari aplikasi SIMPA, termasuk pengaturan KTA (misalnya: nama ketua, tanda tangan). Disimpan dalam bentuk *Key-Value store*.

---

## 🛡️ 10. Role & Akses (RBAC) (`/dashboard/role-akses`)
Sistem hak akses berlapis (Role-Based Access Control) untuk menjaga keamanan data. Memiliki 14 *permission flags* granular, di antaranya:
*   `allowDashboard`
*   `viewDataAnggota` / `manageDataAnggota`
*   `viewTasykil` / `manageTasykil`
*   `viewCalonAnggota` / `manageCalonAnggota`
*   `viewJadwalKegiatan` / `manageJadwalKegiatan`
*   `viewPengaturan` / `managePengaturan`
*   `viewKeuangan` / `manageKeuangan`

Hak akses ini memastikan hanya pengguna dengan role yang tepat (misal: Admin, Bendahara) yang bisa melihat atau mengelola modul tertentu.

---

## 👤 11. Profil Pengguna (`/dashboard/profil`)
Halaman di mana pengguna yang sedang login dapat memperbarui informasi akun pribadi, mengganti password, atau memperbarui foto profil mereka sendiri.

---
*Wiki ini mengacu pada implementasi sistem SIMPA v1.0.*

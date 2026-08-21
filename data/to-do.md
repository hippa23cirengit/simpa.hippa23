# 🚀 Rencana Fitur Masa Depan SIMPA HIPPA

Dokumen ini berisi daftar ide dan konsep fitur yang akan dikembangkan selanjutnya. Sesuai kesepakatan, ini baru sebatas konsep (ngobrol) dan eksekusinya nanti menyusul.

## 💰 1. Modul Keuangan (Finance)
Konsep pengelolaan keuangan organisasi HIPPA. Mengingat ini adalah sebuah organisasi, pencatatan keuangan sangatlah penting.
* **Tujuan**: Memudahkan pencatatan, transparansi, dan monitoring arus kas organisasi.
* **Gambaran Awal**:
  - Pencatatan Pemasukan (Iuran anggota, infaq, donasi, dll).
  - Pencatatan Pengeluaran (Biaya acara, operasional, dll).
  - Dashboard Rekap Kas & Laporan Keuangan.
* *(Detail alur kerja dan struktur data akan didiskusikan lebih lanjut)*

## 🪪 2. e-KTA (Kartu Tanda Anggota Elektronik)
Halaman khusus untuk men-generate dan mencetak E-KTA anggota secara otomatis berdasarkan data yang ada di sistem.
* **Tujuan**: Memberikan identitas resmi secara cepat dan rapi.
* **Data Wajib yang Ditampilkan di E-KTA**:
  - [ ] Pas Foto (Format kotak/rounded yang sudah kita buat)
  - [ ] Nama Lengkap
  - [ ] Tempat & Tanggal Lahir
  - [ ] Alamat
  - [ ] Masa Berlaku KTA
* **Ide Tambahan/Teknis (Untuk dibahas nanti)**:
  - Harus ada "Template Background KTA" yang statis, lalu teksnya di-overlay dengan posisi yang pas.
  - Opsi *Download as PDF* atau *Download as Image* (JPG/PNG).
  - Halaman ber-UI khusus agar saat ditekan `Ctrl + P` (Print), layout-nya pas dengan ukuran kartu standar ID Card (misal: 85.6mm x 54mm).

# Memecah Field Alamat di Master Data Anggota

Memisahkan inputan alamat tunggal menjadi 5 field spesifik agar data lebih terstruktur, rapi, dan mudah diolah untuk keperluan cetak KTA nantinya.

## User Review Required
> [!IMPORTANT]
> Mohon konfirmasi apakah field `rtRw`, `kelDesa`, `kecamatan`, dan `kabKota` sifatnya **wajib (required)** diisi, atau **opsional (boleh kosong)** saat menginput anggota baru? Saat ini saya rancang sebagai wajib diisi agar data KTA nanti seragam.

## Proposed Changes

---

### Database / Tipe Data
#### [MODIFY] `src/common/lib/mock-db.ts`
- Update `interface Member` dengan menambahkan atribut baru:
  - `rtRw?: string;`
  - `kelDesa?: string;`
  - `kecamatan?: string;`
  - `kabKota?: string;`
  *(Catatan: `alamat` yang sudah ada akan difungsikan khusus sebagai "Alamat Lengkap / Nama Jalan")*
- Menambahkan fallback saat membaca data lama agar aplikasi tidak error jika field tersebut kosong.

---

### Halaman Tambah Anggota
#### [MODIFY] `src/app/dashboard/data-anggota/tambah/page.tsx`
- **Schema Zod**: Menambahkan validasi untuk 4 field alamat baru.
- **Form UI**: Mengubah field "Alamat" tunggal menjadi sebuah *Group Input* atau Grid yang berisi:
  - Alamat lengkap (Textarea)
  - RT/RW (Input Text, contoh: "01/05")
  - Kel/Desa (Input Text)
  - Kecamatan (Input Text)
  - Kab/Kota (Input Text)

---

### Halaman Edit Anggota
#### [MODIFY] `src/app/dashboard/data-anggota/edit/[id]/page.tsx`
- **Schema Zod**: Menambahkan validasi yang sama.
- **Form UI**: Menerapkan grid input alamat yang sama seperti di halaman Tambah.
- **Data Binding**: Mengambil data `rtRw`, `kelDesa`, dll dari state ke form.

---

### Halaman Daftar Anggota
#### [MODIFY] `src/app/dashboard/data-anggota/page.tsx`
- **Kolom Tabel/List**: Menggabungkan data alamat (concatenation) saat ditampilkan di detail list, misalnya menjadi format: `"Jl. Cirengit, RT/RW 01/05, Kel. A, Kec. B, Kab. C"`.

## Verification Plan
### Automated Tests
- Menjalankan `npm run build` untuk memastikan tidak ada error tipe data Typescript.
### Manual Verification
- Coba tambah data anggota baru, pastikan field-field alamat baru bisa disimpan dan ditampilkan dengan benar.
- Coba edit data lama, pastikan tidak error saat data alamat tambahannya masih kosong.

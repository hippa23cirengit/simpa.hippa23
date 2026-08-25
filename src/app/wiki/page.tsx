import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Buku Panduan SIMPA',
  description: 'Panduan penggunaan aplikasi Sistem Informasi Manajemen Pengurus dan Anggota (SIMPA) untuk pengguna.',
};

export default function GuideBookPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-4xl bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-8">
          <Link 
            href="/login" 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Aplikasi
          </Link>
        </div>

        <header className="border-b border-slate-100 pb-8 mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo HIPPA"
              width={80}
              height={80}
              className="object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Buku Panduan Pengguna SIMPA
          </h1>
          <p className="text-lg text-emerald-600 mt-2 font-medium">
            Sistem Informasi Manajemen Pengurus dan Anggota HIPPA
          </p>
          <p className="text-slate-600 mt-4 leading-relaxed max-w-2xl mx-auto">
            Selamat datang! Halaman ini adalah panduan langkah demi langkah untuk membantu Anda menggunakan aplikasi SIMPA. Temukan cara mengakses fitur-fitur yang Anda butuhkan di bawah ini.
          </p>
        </header>

        <div className="space-y-8">
          
          <GuideSection 
            number="1"
            icon={<span className="material-symbols-outlined text-[28px] text-indigo-500">login</span>}
            title="Cara Masuk (Login) ke Aplikasi"
          >
            <p className="mb-2 text-slate-600">Untuk dapat menggunakan aplikasi, Anda harus masuk (login) terlebih dahulu:</p>
            <p className="mb-4 text-sm text-red-500 italic">
              *Catatan: Hanya anggota/pengurus HIPPA yang sudah didaftarkan oleh admin yang dapat login ke dalam sistem. Jika Anda anggota tetapi belum terdaftar, silakan hubungi PIMHAR (Ketua hingga Bendahara) untuk meminta didaftarkan.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>Buka halaman awal aplikasi SIMPA.</li>
              <li>Masukkan <strong>Nomor Pokok Anggota (NPA)</strong> Anda pada kolom NPA.</li>
              <li>Masukkan <strong>Kata Sandi (Password)</strong> Anda.</li>
              <li>Klik tombol <strong>Masuk</strong>.</li>
              <li className="text-sm text-slate-500 mt-2 bg-slate-100 p-2 rounded border border-slate-200">
                <em>Catatan: Jika Anda lupa kata sandi, klik tulisan "Lupa Password?" di halaman login untuk mengatur ulang kata sandi melalui email Anda.</em>
              </li>
            </ol>
          </GuideSection>

          <GuideSection 
            number="2"
            icon={<span className="material-symbols-outlined text-[28px] text-sky-500">dashboard</span>}
            title="Mengenal Halaman Utama (Beranda)"
          >
            <p className="mb-2 text-slate-600">Setelah berhasil masuk, Anda akan diarahkan ke <strong>Beranda (Dashboard)</strong>.</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Di halaman ini, Anda bisa melihat ringkasan singkat tentang organisasi, seperti jumlah anggota, total uang kas saat ini, dan jadwal kegiatan terdekat.</li>
              <li>Gunakan <strong>Menu Navigasi</strong> di sebelah kiri (atau ikon garis tiga di pojok jika di HP) untuk berpindah ke menu lain.</li>
            </ul>
          </GuideSection>

          <GuideSection 
            number="3"
            icon={<span className="material-symbols-outlined text-[28px] text-blue-500">database</span>}
            title="Melihat & Mencetak Kartu Tanda Anggota (KTA)"
          >
            <p className="mb-2 text-slate-600">Sebagai anggota, Anda memiliki KTA digital yang sah:</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>Pilih menu <strong>Data Anggota</strong> dari navigasi samping.</li>
              <li>Cari nama Anda di dalam daftar anggota.</li>
              <li>Klik tombol <strong>Lihat KTA</strong> di samping nama Anda.</li>
              <li>KTA digital Anda akan muncul (lengkap dengan QR Code). Anda bisa menyimpannya atau mencetaknya.</li>
            </ol>
          </GuideSection>

          <GuideSection 
            number="4"
            icon={<span className="material-symbols-outlined text-[28px] text-orange-500">groups</span>}
            title="Informasi Kepengurusan (Tasykil)"
          >
            <p className="mb-2 text-slate-600">Ingin tahu siapa saja pengurus organisasi saat ini?</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Klik menu <strong>Tasykil</strong>.</li>
              <li>Anda bisa melihat daftar Pimpinan Harian (Ketua, Sekretaris, Bendahara, dll).</li>
              <li>Anda juga dapat melihat pembagian bidang-bidang beserta anggota yang ditugaskan di bidang tersebut.</li>
            </ul>
          </GuideSection>

          <GuideSection 
            number="5"
            icon={<span className="material-symbols-outlined text-[28px] text-red-500">calendar_month</span>}
            title="Melihat Jadwal Kegiatan"
          >
            <p className="mb-2 text-slate-600">Jangan sampai terlewat agenda penting organisasi!</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Buka menu <strong>Jadwal Kegiatan</strong>.</li>
              <li>Anda akan melihat kalender beserta daftar acara, rapat, atau pengajian yang akan datang.</li>
              <li>Sistem juga akan otomatis mengirimkan pengingat ke nomor WhatsApp Anda menjelang kegiatan berlangsung.</li>
            </ul>
          </GuideSection>

          <GuideSection 
            number="6"
            icon={<span className="material-symbols-outlined text-[28px] text-emerald-500">account_balance_wallet</span>}
            title="Informasi Uang Kas"
          >
            <p className="mb-2 text-slate-600">SIMPA mengedepankan transparansi keuangan organisasi:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Klik menu <strong>Keuangan</strong>.</li>
              <li>Anda dapat melihat riwayat uang masuk dan uang keluar.</li>
              <li>Jika Anda adalah bendahara atau pengurus yang diberi akses, Anda juga dapat menambahkan data transaksi baru di halaman ini.</li>
            </ul>
          </GuideSection>

          <GuideSection 
            number="7"
            icon={<span className="material-symbols-outlined text-[28px] text-purple-500">account_circle</span>}
            title="Mengatur Profil Anda"
          >
            <p className="mb-2 text-slate-600">Pastikan data pribadi Anda selalu ter-update:</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>Klik menu <strong>Profil</strong> di navigasi samping.</li>
              <li>Di sini Anda dapat memperbarui foto profil.</li>
              <li>Anda juga dapat mengubah kata sandi (password) jika diperlukan.</li>
              <li>Pastikan nomor HP/WhatsApp yang terdaftar sudah benar agar tidak ketinggalan informasi.</li>
            </ol>
          </GuideSection>

        </div>

        <footer className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Butuh bantuan lebih lanjut? Silakan hubungi pengurus atau admin sistem SIMPA HIPPA.
          </p>
        </footer>
      </div>
    </div>
  );
}

function GuideSection({ number, icon, title, children }: { number: string, icon: React.ReactNode, title: string, children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4 bg-slate-50 p-4 border-b border-slate-100">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold text-slate-400 border border-slate-200 text-sm shadow-sm">
          {number}
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-center w-12 h-12">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";

export default function PublicPortal() {
  const upcomingEvents = [
    {
      id: 1,
      title: "Musyawarah Anggota & Rencana Kerja Himpunan",
      date: "Sabtu, 22 Agustus 2026",
      time: "09:00 - 12:00 WIB",
      location: "Sekretariat HIPPA Cirengit",
      description: "Koordinasi program kerja kepengurusan baru serta penyusunan anggaran kegiatan kepemudaan.",
      category: "Musyawarah",
      badgeColor: "bg-amber-100 text-amber-800"
    },
    {
      id: 2,
      title: "Kajian Rutin Mingguan: Pemuda Akhir Zaman",
      date: "Jumat, 28 Agustus 2026",
      time: "16:00 WIB - Selesai",
      location: "Masjid Al-Ikhlas Cirengit",
      description: "Kajian keislaman rutin membahas peran pemuda dalam menjaga nilai-nilai dakwah di era modern.",
      category: "Kajian",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      id: 3,
      title: "Latihan Kepemimpinan Pelajar (LKP) Mandiri",
      date: "Rabu, 2 September 2026",
      time: "13:30 - 15:30 WIB",
      location: "Aula Gedung Serbaguna Cirengit",
      description: "Pelatihan kepemimpinan dan manajemen organisasi untuk mencetak kader tasykil yang militan.",
      category: "Kaderisasi",
      badgeColor: "bg-emerald-100 text-emerald-800"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo HIPPA Cirengit"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <h1 className="font-title-lg text-[18px] font-bold text-slate-900 leading-tight">SIMPA HIPPA</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Cirengit</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Masuk Aplikasi
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950 text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent -z-10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block bg-amber-500/20 text-[#f7a440] font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-amber-500/30">
            Portal Informasi Publik
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Sistem Informasi Manajemen Pengurus & Anggota
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Selamat datang di portal SIMPA Himpunan Pelajar Persatuan Islam (HIPPA) Cirengit. Kami hadir untuk mewujudkan tata kelola organisasi yang tertib, modern, transparan, dan berkelanjutan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="#kegiatan"
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg border border-slate-700 transition duration-300"
            >
              Lihat Kegiatan Terdekat
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/10 transition duration-300"
            >
              Masuk Dashboard Pengurus
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content - Upcoming Activities */}
      <main id="kegiatan" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kegiatan Terdekat & Mendatang
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Jadwal kegiatan berkala, rapat koordinasi, kajian rutin, dan program kerja Himpunan Pelajar Persatuan Islam (HIPPA) Cirengit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${event.badgeColor} mb-4`}>
                  {event.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3">
                  {event.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {event.description}
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 font-medium text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                  <span className="text-slate-700 font-semibold">{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo HIPPA Cirengit"
              width={36}
              height={36}
              className="rounded-full grayscale opacity-70 object-cover"
            />
            <div>
              <p className="text-white font-semibold text-sm">SIMPA HIPPA Cirengit</p>
              <p className="text-xs text-slate-500">Himpunan Pelajar Persatuan Islam (Putra) Cirengit</p>
            </div>
          </div>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} PJ. Pemuda Persis Cirengit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

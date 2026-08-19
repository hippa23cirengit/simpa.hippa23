export default function ProfilPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Profil Pengguna</h2>
        <p className="font-body-md text-sm text-slate-500 mt-1">Atur informasi akun dan keamanan kata sandi Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar & Photo Actions (Span 4) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center">
          <h3 className="font-title-lg text-sm font-bold text-slate-800 self-start mb-4">Foto Profil</h3>
          <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-200 flex items-center justify-center text-3xl font-bold text-[#895200] shadow-inner mb-4">
            AF
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed px-4 mb-5">
            Unggah foto profil baru. Format JPG, PNG, atau WEBP. Maksimal 2MB.
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button className="w-full bg-[#F7A440]/10 hover:bg-[#F7A440]/20 text-[#895200] font-bold py-2 px-4 rounded-xl text-xs transition duration-250 border border-[#f7a440]/20">
              Pilih Foto Baru
            </button>
            <button className="w-full border border-red-100 hover:bg-red-50 text-red-600 font-bold py-2 px-4 rounded-xl text-xs transition duration-250">
              Hapus Foto
            </button>
          </div>
        </div>

        {/* Right Column: Profile Info & Change Password Forms (Span 8) */}
        <div className="md:col-span-8 space-y-6">
          {/* Section 1: Personal Info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="font-title-lg text-base font-bold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#F7A440]">badge</span>
              Informasi Pribadi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  defaultValue="Ahmad Fauzan"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jabatan</label>
                <input
                  type="text"
                  value="Administrator"
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Email</label>
                <input
                  type="email"
                  defaultValue="ahmad.fauzan@example.com"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</label>
                <input
                  type="text"
                  defaultValue="0812-3456-7890"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Security / Password */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="font-title-lg text-base font-bold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#F7A440]">lock_open</span>
              Keamanan Kata Sandi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kata Sandi Lama</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Konfirmasi Baru</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="flex justify-end gap-3">
            <button className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 text-xs transition duration-200">
              Batal
            </button>
            <button className="px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm">
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

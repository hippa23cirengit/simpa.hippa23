"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { logRecentLogin, syncDatabaseFromServer } from "@/common/lib/mock-db";
import { setSession } from "@/common/lib/auth";
import { loginAction } from "@/modules/auth/actions/login.action";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [npa, setNpa] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedNpa = npa.trim();
    const trimmedPassword = password.trim();

    if (!trimmedNpa || !trimmedPassword) {
      setLoading(false);
      setError("NPA dan Password wajib diisi.");
      return;
    }

    try {
      const res = await loginAction({
        npa: trimmedNpa,
        password: trimmedPassword,
      });

      if (!res.success || !res.user) {
        setLoading(false);
        setError(res.error || "Gagal masuk. Periksa kembali NPA dan password Anda.");
        return;
      }

      setSession({
        isLoggedIn: true,
        npa: res.user.npa,
        name: res.user.name,
        role: res.user.role,
        loginAt: Date.now(),
      });

      logRecentLogin(res.user.npa, res.user.name, res.user.role);

      // Sinkronkan data database ke background client
      syncDatabaseFromServer().catch(console.error);

      router.replace("/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Terjadi kesalahan koneksi saat verifikasi login.");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-4xl mx-auto", className)} {...props}>
      <Card className="overflow-hidden p-0 rounded-3xl shadow-xl shadow-slate-200/50 border-slate-100">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
          <form className="p-8 md:p-12 flex flex-col justify-center" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center mb-6">
                <Image
                  src="/logo.png"
                  alt="Logo HIPPA Cirengit"
                  width={64}
                  height={64}
                  className="object-contain shrink-0 drop-shadow-sm mb-2"
                />
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Login SIMPA</h1>
                <p className="text-balance text-sm font-medium text-slate-500">
                  Himpunan Pelajar Persatuan Islam Putra (HIPPA) Cirengit
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="npa">NPA (Nomor Pokok Anggota)</FieldLabel>
                <Input
                  id="npa"
                  type="text"
                  placeholder="Contoh: 26.0000"
                  required
                  value={npa}
                  onChange={(e) => setNpa(e.target.value)}
                  className="h-11 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-[#F7A440]"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Masukkan password"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-[#F7A440] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F7A440] transition-colors flex items-center justify-center"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: showPassword ? "'FILL' 1" : "'FILL' 0", color: showPassword ? "#F7A440" : "inherit" }}>
                      lightbulb
                    </span>
                  </button>
                </div>
                
                {/* Aksi di bawah input password */}
                <div className="flex items-center justify-between mt-2 pt-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#F7A440]">help</span>
                    Butuh bantuan login?
                  </button>

                  <Link
                    href="/forgot-password"
                    className="font-semibold text-[#F7A440] hover:text-[#e59333] hover:underline transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>
              </Field>
              <Field className="pt-2">
                <Button type="submit" disabled={loading} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-base">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Authenticating...
                    </div>
                  ) : (
                    "Masuk ke Dashboard"
                  )}
                </Button>
              </Field>
              
            </FieldGroup>
          </form>
          <div className="relative hidden bg-slate-900 md:flex flex-col items-center justify-center p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-900 to-slate-950"></div>
            <div className="relative z-10 flex flex-col items-center">
              <span className="material-symbols-outlined text-[64px] text-[#F7A440] mb-6">space_dashboard</span>
              <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">Sistem Informasi Manajemen<br/>Pengurus & Anggota</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                Kelola data keanggotaan, jadwal kegiatan, dan administrasi organisasi dalam satu pintu dengan mudah dan transparan.
              </p>
            </div>
            
            <svg className="absolute bottom-0 left-0 text-white/5 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="0,100 100,0 100,100" />
            </svg>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-6 mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors bg-white/50 hover:bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Kembali ke Halaman Utama
        </Link>
      </div>

      <FieldDescription className="px-6 text-center text-xs text-slate-400 font-medium">
        SIMPA HIPPA © {new Date().getFullYear()} Cirengit.<br/>
        Sistem internal khusus anggota.
      </FieldDescription>

      {/* Modal Popup Bantuan Login */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scaleIn flex flex-col p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-[#F7A440] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">contact_support</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Bantuan Akses Login
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    SIMPA HIPPA Cirengit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Ketentuan Akses Pengguna:</span>
              </div>
              <p>
                Hanya anggota atau pengurus HIPPA yang sudah didaftarkan oleh admin yang dapat login ke dalam sistem SIMPA.
              </p>
              <p>
                Jika Anda adalah anggota atau alumni tetapi belum terdaftar memiliki akun, silakan hubungi <strong>PIMHAR (Ketua hingga Bendahara)</strong> untuk meminta pembukaan akses login akun Anda.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

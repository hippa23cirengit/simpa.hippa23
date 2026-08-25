"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStoredAccounts, getStoredTasykil } from "@/common/lib/mock-db";
import { setSession } from "@/common/lib/auth";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let trimmedNpa = npa.trim();
    const trimmedPassword = password.trim();

    if (!trimmedNpa || !trimmedPassword) {
      setLoading(false);
      setError("NPA dan Password wajib diisi.");
      return;
    }

    if (/^\d{6}$/.test(trimmedNpa)) {
      trimmedNpa = trimmedNpa.slice(0, 2) + "." + trimmedNpa.slice(2);
    }

    setTimeout(() => {
      const accounts = getStoredAccounts();
      const account = accounts.find(
        (acc) => acc.npa.toLowerCase() === trimmedNpa.toLowerCase()
      );

      if (!account) {
        setLoading(false);
        setError("NPA tidak terdaftar di database.");
        return;
      }

      if (trimmedPassword !== account.passwordHash) {
        setLoading(false);
        setError("Password yang Anda masukkan salah.");
        return;
      }

      let resolvedRole = account.role;
      if (account.npa === "26.0000") {
        resolvedRole = "Super Admin";
      } else if (account.linkedAnggotaId) {
        const tasykil = getStoredTasykil();
        const memberId = account.linkedAnggotaId;
        if (tasykil.pimhar.ketua === memberId) resolvedRole = "Ketua";
        else if (tasykil.pimhar.wakilKetua === memberId) resolvedRole = "Wakil Ketua";
        else if (tasykil.pimhar.sekretaris === memberId) resolvedRole = "Sekretaris";
        else if (tasykil.pimhar.wakilSekretaris === memberId) resolvedRole = "Wakil Sekretaris";
        else if (tasykil.pimhar.bendahara === memberId) resolvedRole = "Bendahara";
        else if (tasykil.pimhar.wakilBendahara === memberId) resolvedRole = "Wakil Bendahara";
        else {
          const activeBidang = tasykil.bidang.find((b) =>
            b.members.includes(memberId)
          );
          if (activeBidang) {
            resolvedRole = activeBidang.name;
          } else {
            resolvedRole = "Anggota";
          }
        }
      }

      setSession({
        isLoggedIn: true,
        npa: account.npa,
        name: account.name,
        role: resolvedRole,
        loginAt: Date.now(),
      });

      router.replace("/dashboard");
    }, 800);
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
                <p className="text-xs text-red-500 italic mt-2">
                  *Catatan: Hanya anggota/pengurus HIPPA yang sudah didaftarkan oleh admin yang dapat login ke dalam sistem. Jika Anda anggota tetapi belum terdaftar, silakan hubungi PIMHAR (Ketua hingga Bendahara) untuk meminta akses.
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-xs font-semibold text-[#F7A440] hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
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
      <FieldDescription className="px-6 text-center text-xs text-slate-400 font-medium">
        SIMPA HIPPA © {new Date().getFullYear()} Cirengit.<br/>
        Sistem internal khusus anggota.
      </FieldDescription>
    </div>
  )
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStoredMembers, getStoredTasykil } from "@/common/lib/mock-db";
import { setSession, isLoggedIn, clearSession } from "@/common/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [npa, setNpa] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear session on mount to act as a logout guard
  useEffect(() => {
    clearSession();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      // Find member in mock db
      const members = getStoredMembers();
      const member = members.find(
        (m) => m.id.toLowerCase() === trimmedNpa.toLowerCase()
      );

      if (!member) {
        setLoading(false);
        setError("NPA tidak terdaftar di database.");
        return;
      }

      // Check password (default password: cirengit23)
      if (trimmedPassword !== "cirengit23") {
        setLoading(false);
        setError("Password yang Anda masukkan salah.");
        return;
      }

      // Determine role dynamically based on member assignments
      let role = "Anggota";
      if (member.id === "26.0000") {
        role = "Super Admin";
      } else {
        const tasykil = getStoredTasykil();
        const isPimhar = Object.values(tasykil.pimhar).includes(member.id);
        const isBidang = tasykil.bidang.some((b) => b.members.includes(member.id));
        if (isPimhar) {
          role = "PIMHAR";
        } else if (isBidang) {
          role = "Bidang";
        }
      }

      // Save user session
      setSession({
        isLoggedIn: true,
        npa: member.id,
        name: member.name,
        role: role,
        loginAt: Date.now(),
      });

      // Redirect to dashboard (using replace so back history doesn't return to login)
      router.replace("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-8">
        {/* Brand/Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo HIPPA Cirengit"
              width={64}
              height={64}
              className="rounded-full object-cover shadow-sm border border-slate-100"
            />
            <div className="text-center">
              <h1 className="font-title-lg text-2xl font-bold text-slate-900 leading-tight">SIMPA HIPPA</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Desa Cirengit</p>
            </div>
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Masuk ke Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Silakan masukkan NPA dan password Anda.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              NPA (Nomor Pokok Anggota)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                badge
              </span>
              <input
                type="text"
                placeholder="Contoh: 23.001"
                value={npa}
                onChange={(e) => setNpa(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg font-body-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] focus:ring-2 focus:ring-[#f7a440]/10 transition-all bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                lock
              </span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg font-body-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] focus:ring-2 focus:ring-[#f7a440]/10 transition-all bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-[#F7A440] focus:ring-[#F7A440] w-4 h-4 cursor-pointer"
              />
              <span>Ingat Saya</span>
            </label>
            <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors">
              Lupa Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold text-sm py-2.5 rounded-lg shadow-md hover:shadow-amber-500/10 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                Masuk
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Kembali ke Portal Publik
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { verifyResetTokenAction } from "@/modules/auth/actions/verify-reset-token.action";
import { resetPasswordAction } from "@/modules/auth/actions/reset-password.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userName, setUserName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenError("Token reset password tidak ditemukan.");
        setTokenValid(false);
        setVerifying(false);
        return;
      }

      try {
        const res = await verifyResetTokenAction(token);
        if (res && res.success) {
          setTokenValid(true);
          setUserName(res.name || "");
        } else {
          setTokenError(res.error || "Token tidak valid atau sudah kedaluwarsa.");
        }
      } catch (err: any) {
        setTokenError("Terjadi kesalahan saat memverifikasi token.");
      } finally {
        setVerifying(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setLoading(false);
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      const res = await resetPasswordAction({
        token,
        password,
        confirmPassword,
      });

      if (res && res.success) {
        setSuccess(true);
      } else {
        setError(res?.error || "Gagal mereset password.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0 rounded-3xl shadow-xl shadow-slate-200/50 border-slate-100 max-w-md mx-auto">
      <CardContent className="p-8 md:p-10 flex flex-col justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <Image
            src="/logo.png"
            alt="Logo HIPPA Cirengit"
            width={56}
            height={56}
            className="object-contain shrink-0 drop-shadow-sm mb-2"
          />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Atur Ulang Password</h1>
          <p className="text-sm font-medium text-slate-500 max-w-xs">
            {verifying ? "Memverifikasi token keamanan..." : tokenValid ? `Halo Rekan ${userName}, silakan buat password baru Anda.` : "Proses verifikasi gagal."}
          </p>
        </div>

        {verifying ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#F7A440] rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Harap tunggu sebentar...</p>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 text-red-500">
              <span className="material-symbols-outlined text-[32px]">link_off</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-800">Link Tidak Valid</h2>
              <p className="text-sm text-slate-500 leading-relaxed text-balance text-center">
                {tokenError || "Tautan yang Anda gunakan tidak valid atau sudah kedaluwarsa."}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href="/forgot-password"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center text-sm"
              >
                Minta Link Baru
              </Link>
              <Link
                href="/login"
                className="text-sm font-bold text-[#F7A440] hover:text-[#e59333] transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-500">
              <span className="material-symbols-outlined text-[32px]">lock_open</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-800">Password Berhasil Diubah</h2>
              <p className="text-sm text-slate-500 leading-relaxed text-balance text-center">
                Password Anda telah berhasil diperbarui. Silakan login kembali dengan password baru Anda.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/login"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center text-sm"
              >
                Login Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                <span className="leading-tight text-left">{error}</span>
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Password Baru</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#F7A440] pr-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F7A440] transition-colors flex items-center justify-center"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{
                        fontVariationSettings: showPassword ? "'FILL' 1" : "'FILL' 0",
                        color: showPassword ? "#F7A440" : "inherit"
                      }}
                    >
                      lightbulb
                    </span>
                  </button>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Konfirmasi Password Baru</FieldLabel>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kembali password baru"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#F7A440]"
                  disabled={loading}
                />
              </Field>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-base"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan password...
                    </div>
                  ) : (
                    "Simpan Password Baru"
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

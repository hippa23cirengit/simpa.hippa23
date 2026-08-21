"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { forgotPasswordAction } from "@/modules/auth/actions/forgot-password.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [npa, setNpa] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let trimmedNpa = npa.trim();
    const trimmedEmail = email.trim();
    if (!trimmedNpa || !trimmedEmail) {
      setLoading(false);
      setError("NPA dan Email wajib diisi.");
      return;
    }

    // Format NPA if 6 digits without dot
    if (/^\d{6}$/.test(trimmedNpa)) {
      trimmedNpa = trimmedNpa.slice(0, 2) + "." + trimmedNpa.slice(2);
    }

    try {
      const res = await forgotPasswordAction({ npa: trimmedNpa, email: trimmedEmail });
      if (res && res.success) {
        setSuccess(true);
        setEmailSentTo(res.email || "");
      } else {
        setError(res?.error || "Gagal memproses permintaan reset password.");
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lupa Password?</h1>
          <p className="text-sm font-medium text-slate-500 max-w-xs">
            Masukkan NPA dan Email terdaftar Anda untuk menerima tautan reset password.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-500">
              <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-800">Email Berhasil Dikirim</h2>
              <p className="text-sm text-slate-500 leading-relaxed text-balance text-center">
                Tautan untuk mereset password telah dikirim ke email:<br />
                <strong className="text-slate-800 font-semibold">{emailSentTo}</strong>
              </p>
              <p className="text-xs text-slate-400">
                Silakan cek kotak masuk atau folder spam email Anda. Tautan berlaku selama 1 jam.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#F7A440] hover:text-[#e59333] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke Halaman Login
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
                <FieldLabel htmlFor="npa" className="text-slate-700 font-bold">NPA (Nomor Pokok Anggota)</FieldLabel>
                <Input
                  id="npa"
                  type="text"
                  placeholder="Contoh: 26.0000"
                  required
                  value={npa}
                  onChange={(e) => setNpa(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#F7A440]"
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className="text-slate-700 font-bold">Email Terdaftar</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Contoh: nama@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                      Mengirim email...
                    </div>
                  ) : (
                    "Kirim Link Reset"
                  )}
                </Button>
              </div>
            </FieldGroup>

            <div className="text-center pt-4 border-t border-slate-100">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

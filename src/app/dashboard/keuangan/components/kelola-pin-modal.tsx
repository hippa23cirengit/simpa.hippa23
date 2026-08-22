"use client"

import React, { useState, useEffect, useRef } from "react"
import { getSessionUser } from "@/common/lib/auth"
import { getStoredAccounts, getStoredMembers } from "@/common/lib/mock-db"

interface KelolaPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type ModalState = "input" | "setup" | "forgot_confirm" | "otp" | "new_pin"

export function KelolaPinModal({ isOpen, onClose, onSuccess }: KelolaPinModalProps) {
  const [step, setStep] = useState<ModalState>("input")
  const [pin, setPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [otp, setOtp] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [maskedEmail, setMaskedEmail] = useState("")
  const [countdown, setCountdown] = useState(0)

  const [userData, setUserData] = useState({ name: "", email: "" })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser && sessionUser.name) {
      const accounts = getStoredAccounts();
      const acc = accounts.find(a => a.npa === sessionUser.npa);
      let email = "";
      if (acc && acc.linkedAnggotaId) {
        const members = getStoredMembers();
        const mem = members.find(m => m.id === acc.linkedAnggotaId);
        if (mem) {
          email = mem.email || "";
        }
      }
      setUserData({ name: sessionUser.name, email });
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setStep("input")
      setPin("")
      setNewPin("")
      setConfirmPin("")
      setOtp("")
      setErrorMsg(null)
      setCountdown(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [countdown])

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/kas/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setPin("")
        onSuccess()
      } else {
        if (data.error && data.error.includes("belum diatur")) {
          setStep("setup")
        } else {
          setErrorMsg(data.error || "Gagal memverifikasi PIN")
        }
      }
    } catch (error: any) {
      setErrorMsg("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin !== confirmPin) {
      setErrorMsg("Konfirmasi PIN tidak cocok")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/kas/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess()
      } else {
        setErrorMsg(data.error || "Gagal mengatur PIN")
      }
    } catch (error: any) {
      setErrorMsg("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    if (!userData || !userData.email) {
      setErrorMsg("Email akun Anda tidak ditemukan.")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/kas/request-pin-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userData.email, name: userData.name })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setMaskedEmail(data.email)
        setStep("otp")
        setCountdown(300) // 5 minutes
      } else {
        setErrorMsg(data.error || "Gagal mengirim OTP")
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin !== confirmPin) {
      setErrorMsg("Konfirmasi PIN tidak cocok")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/kas/reset-pin-via-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newPin })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        onSuccess()
      } else {
        setErrorMsg(data.error || "Gagal mereset PIN")
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">
              {step === "input" ? "lock" : step === "setup" ? "vpn_key" : "lock_reset"}
            </span>
            {step === "input" ? "Buka Akses Edit" : step === "setup" ? "Atur PIN Keuangan" : "Reset PIN"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-lg flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMsg}
            </div>
          )}

          {step === "input" && (
            <form onSubmit={handleVerifyPin} className="flex flex-col gap-4">
              <p className="text-sm text-slate-500 text-center">
                Masukkan PIN keamanan untuk mengaktifkan akses edit.
              </p>
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verifikasi PIN"}
              </button>
              <button type="button" onClick={() => { setStep("forgot_confirm"); setErrorMsg(null); }} className="text-xs text-center text-slate-400 hover:text-amber-600 font-medium mt-2">
                Lupa PIN?
              </button>
            </form>
          )}

          {step === "setup" && (
            <form onSubmit={handleSetupPin} className="flex flex-col gap-4">
              <p className="text-sm text-slate-500 text-center">
                PIN belum diatur. Silakan buat PIN baru (4-6 digit).
              </p>
              <input
                type="password"
                required
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN Baru"
                className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition"
                autoFocus
              />
              <input
                type="password"
                required
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Konfirmasi PIN"
                className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                disabled={loading || newPin.length < 4 || confirmPin.length < 4}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Simpan PIN Baru"}
              </button>
            </form>
          )}

          {step === "forgot_confirm" && (
            <div className="flex flex-col gap-4 text-center">
              <span className="material-symbols-outlined text-4xl text-amber-500 mx-auto">mark_email_read</span>
              <p className="text-sm text-slate-600">
                Kami akan mengirimkan kode OTP 6-digit ke email terdaftar Anda untuk mereset PIN Keuangan.
              </p>
              <p className="text-xs font-semibold text-slate-800 bg-slate-100 p-2 rounded-lg">
                {userData.email || "Email tidak tersedia"}
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Kirim Kode OTP"}
              </button>
              <button onClick={() => setStep("input")} className="text-xs text-slate-500 hover:text-slate-800 font-medium">
                Batal
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500 text-center">
                Kode OTP telah dikirim ke <strong className="text-slate-700">{maskedEmail}</strong>
              </p>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  if (e.target.value.length === 6) {
                    setStep("new_pin");
                  }
                }}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                autoFocus
              />
              <div className="text-center text-xs font-medium text-slate-500">
                {countdown > 0 ? (
                  <span>Berlaku selama {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
                ) : (
                  <span className="text-rose-500">OTP Kadaluarsa</span>
                )}
              </div>
              <button
                onClick={handleRequestOtp}
                disabled={countdown > 0 || loading}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 disabled:text-slate-400"
              >
                Kirim Ulang OTP
              </button>
            </div>
          )}

          {step === "new_pin" && (
            <form onSubmit={handleVerifyOtpAndReset} className="flex flex-col gap-4">
              <p className="text-sm text-slate-500 text-center">
                Buat PIN Keuangan Baru Anda (4-6 digit).
              </p>
              <input
                type="password"
                required
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN Baru"
                className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition"
                autoFocus
              />
              <input
                type="password"
                required
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Konfirmasi PIN Baru"
                className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                disabled={loading || newPin.length < 4 || confirmPin.length < 4 || !otp}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verifikasi OTP & Simpan"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

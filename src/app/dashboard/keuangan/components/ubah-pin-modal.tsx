"use client"

import React, { useState, useEffect } from "react"
import { useDialog } from "@/common/components/dialog-provider"

interface UbahPinModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UbahPinModal({ isOpen, onClose }: UbahPinModalProps) {
  const [oldPin, setOldPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const { showAlert } = useDialog()

  useEffect(() => {
    if (isOpen) {
      setOldPin("")
      setNewPin("")
      setConfirmPin("")
      setErrorMsg(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin !== confirmPin) {
      setErrorMsg("Konfirmasi PIN Baru tidak cocok")
      return
    }
    if (oldPin === newPin) {
      setErrorMsg("PIN Baru tidak boleh sama dengan PIN Lama")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/kas/set-pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onClose()
        showAlert("PIN Keuangan berhasil diubah.", "Berhasil", "success")
      } else {
        setErrorMsg(data.error || "Gagal mengubah PIN")
      }
    } catch (error: any) {
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
            <span className="material-symbols-outlined text-amber-500">settings</span>
            Ubah PIN Keuangan
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">PIN Lama</label>
            <input
              type="password"
              required
              maxLength={6}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">PIN Baru</label>
            <input
              type="password"
              required
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Konfirmasi PIN Baru</label>
            <input
              type="password"
              required
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-xl font-bold border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || oldPin.length < 4 || newPin.length < 4 || confirmPin.length < 4}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Simpan PIN Baru"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

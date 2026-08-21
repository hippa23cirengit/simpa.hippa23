"use client"

import React, { useState, useEffect } from "react"
import { KasKategori } from "@prisma/client"

interface TambahTransaksiModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TambahTransaksiModal({ isOpen, onClose, onSuccess }: TambahTransaksiModalProps) {
  const [tipe, setTipe] = useState<"pemasukan" | "pengeluaran">("pemasukan")
  const [kategoris, setKategoris] = useState<KasKategori[]>([])
  
  // Form State
  const [tanggal, setTanggal] = useState("")
  const [jumlah, setJumlah] = useState("")
  const [kategoriId, setKategoriId] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0]
      setTanggal(today)
      setJumlah("")
      setDeskripsi("")
      setErrorMsg(null)
      fetchKategori()
    }
  }, [isOpen])

  const fetchKategori = async () => {
    try {
      const res = await fetch("/api/kas/kategori")
      if (res.ok) {
        const data = await res.json()
        setKategoris(data)
        // Auto select first category based on current type if available
        const filtered = data.filter((k: KasKategori) => k.tipe === tipe)
        if (filtered.length > 0) {
          setKategoriId(filtered[0].nama)
        } else {
          setKategoriId("")
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Update default category when type changes
  useEffect(() => {
    const filtered = kategoris.filter((k) => k.tipe === tipe)
    if (filtered.length > 0) {
      setKategoriId(filtered[0].nama)
    } else {
      setKategoriId("")
    }
  }, [tipe, kategoris])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tanggal || !jumlah || !kategoriId || !deskripsi) {
      setErrorMsg("Semua field wajib diisi!")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/kas/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe,
          tanggal,
          jumlah,
          kategori: kategoriId,
          deskripsi
        })
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const err = await res.json()
        setErrorMsg(err.error || "Gagal menyimpan transaksi")
      }
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Format currency on typing
  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "")
    setJumlah(val)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className={`material-symbols-outlined ${tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {tipe === 'pemasukan' ? 'trending_up' : 'trending_down'}
            </span>
            Catat Transaksi
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMsg}
            </div>
          )}

          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setTipe("pemasukan")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${tipe === 'pemasukan' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setTipe("pengeluaran")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${tipe === 'pengeluaran' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nominal (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">Rp</span>
                <input
                  type="text"
                  required
                  value={jumlah ? new Intl.NumberFormat('id-ID').format(Number(jumlah)) : ""}
                  onChange={handleJumlahChange}
                  placeholder="0"
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
            <select
              required
              value={kategoriId}
              onChange={(e) => setKategoriId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition bg-white"
            >
              <option value="" disabled>-- Pilih Kategori --</option>
              {kategoris.filter(k => k.tipe === tipe).map(kat => (
                <option key={kat.id} value={kat.nama}>{kat.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan / Deskripsi</label>
            <input
              type="text"
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Beli konsumsi rapat"
              maxLength={100}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#F7A440] hover:bg-[#e09132] text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Transaksi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

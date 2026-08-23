"use client"

import React, { useState, useEffect } from "react"
import { KasKategori, KasTransaksi } from "@prisma/client"

interface TambahTransaksiModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: KasTransaksi | null
}

export function TambahTransaksiModal({ isOpen, onClose, onSuccess, editData }: TambahTransaksiModalProps) {
  const [tipe, setTipe] = useState<"pemasukan" | "pengeluaran">("pemasukan")
  const [kategoris, setKategoris] = useState<KasKategori[]>([])
  
  // Form State
  const [tanggal, setTanggal] = useState("")
  const [jumlah, setJumlah] = useState("")
  const [kategoriId, setKategoriId] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Inline Add Category State
  const [isAddingKategori, setIsAddingKategori] = useState(false)
  const [newKategoriName, setNewKategoriName] = useState("")
  const [addingKategoriLoading, setAddingKategoriLoading] = useState(false)

  const fetchKategori = async () => {
    try {
      const res = await fetch("/api/kas/kategori")
      if (res.ok) {
        const data = await res.json()
        setKategoris(data)
        
        // Auto select first category if not editing and category is empty
        if (!editData) {
          const currentTipe = editData ? (editData as KasTransaksi).tipe : tipe
          const filtered = data.filter((k: KasKategori) => k.tipe === currentTipe)
          if (filtered.length > 0) {
            setKategoriId(filtered[0].nama)
          } else {
            setKategoriId("")
          }
        }
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setTipe(editData.tipe as "pemasukan" | "pengeluaran")
        setTanggal(editData.tanggal)
        setJumlah(editData.jumlah.toString())
        setDeskripsi(editData.deskripsi)
        setKategoriId(editData.kategori)
      } else {
        const today = new Date().toISOString().split("T")[0]
        setTanggal(today)
        setJumlah("")
        setDeskripsi("")
        setKategoriId("")
      }
      setErrorMsg(null)
      fetchKategori()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData])

  // Update default category when type changes
  useEffect(() => {
    if (editData && editData.tipe === tipe && !kategoriId) {
      setKategoriId(editData.kategori)
    } else if (!editData || (editData && editData.tipe !== tipe)) {
      const filtered = kategoris.filter((k) => k.tipe === tipe)
      if (filtered.length > 0) {
        setKategoriId(filtered[0].nama)
      } else {
        setKategoriId("")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipe, kategoris]) // Exclude editData & kategoriId to avoid loops

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tanggal || !jumlah || !kategoriId || !deskripsi) {
      setErrorMsg("Semua field wajib diisi!")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const method = editData ? "PUT" : "POST"
      const url = editData ? `/api/kas/transaksi/${editData.id}` : "/api/kas/transaksi"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe,
          tanggal,
          jumlah: parseInt(jumlah.replace(/\D/g, ""), 10),
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

  const handleAddKategori = async () => {
    if (!newKategoriName.trim()) return
    setAddingKategoriLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/kas/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newKategoriName.trim(), tipe })
      })
      if (res.ok) {
        await fetchKategori()
        setKategoriId(newKategoriName.trim())
        setIsAddingKategori(false)
        setNewKategoriName("")
      } else {
        const err = await res.json()
        setErrorMsg(err.error || "Gagal menambah kategori")
      }
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setAddingKategoriLoading(false)
    }
  }

  // Format currency on typing
  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "")
    setJumlah(val)
  }

  if (!isOpen) return null

  const isEditing = !!editData

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className={`material-symbols-outlined ${tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isEditing ? 'edit' : (tipe === 'pemasukan' ? 'trending_up' : 'trending_down')}
            </span>
            {isEditing ? 'Edit Transaksi' : 'Catat Transaksi'}
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
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
              {!isAddingKategori && (
                <button
                  type="button"
                  onClick={() => setIsAddingKategori(true)}
                  className="text-[10px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-0.5 transition"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span> Tambah Kategori
                </button>
              )}
            </div>
            
            {isAddingKategori ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKategoriName}
                  onChange={(e) => setNewKategoriName(e.target.value)}
                  placeholder="Nama kategori baru..."
                  className="flex-1 text-sm border border-amber-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddKategori}
                  disabled={addingKategoriLoading || !newKategoriName.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-3 py-2 font-bold text-sm transition disabled:opacity-50 flex items-center justify-center"
                >
                  {addingKategoriLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Simpan"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingKategori(false)
                    setNewKategoriName("")
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl px-3 py-2 font-bold text-sm transition"
                >
                  Batal
                </button>
              </div>
            ) : (
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
            )}
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
                {isEditing ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

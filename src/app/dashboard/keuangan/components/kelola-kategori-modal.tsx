"use client"

import React, { useState, useEffect } from "react"
import { KasKategori } from "@prisma/client"
import { useDialog } from "@/common/components/dialog-provider"

interface KelolaKategoriModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function KelolaKategoriModal({ isOpen, onClose, onUpdated }: KelolaKategoriModalProps) {
  const { showAlert, showConfirm } = useDialog()
  const [kategoris, setKategoris] = useState<KasKategori[]>([])
  const [loading, setLoading] = useState(false)
  const [nama, setNama] = useState("")
  const [tipe, setTipe] = useState<"pemasukan" | "pengeluaran">("pemasukan")

  const fetchKategori = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/kas/kategori")
      if (res.ok) {
        const data = await res.json()
        setKategoris(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchKategori()
    }
  }, [isOpen])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim()) return

    try {
      const res = await fetch("/api/kas/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, tipe })
      })
      if (res.ok) {
        setNama("")
        fetchKategori()
        onUpdated()
      } else {
        const err = await res.json()
        showAlert("Gagal menambahkan kategori: " + (err.error || "Unknown error"), "Gagal", "danger")
      }
    } catch (error: any) {
      console.error(error)
      showAlert("Error: " + error.message, "Error", "danger")
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Hapus kategori ini?", "Hapus Kategori", "danger")
    if (!confirmed) return
    try {
      const res = await fetch(`/api/kas/kategori/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchKategori()
        onUpdated()
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">category</span>
            Kelola Kategori
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Form Tambah */}
          <form onSubmit={handleAdd} className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex-grow flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nama Kategori (Maks 20 char)"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                maxLength={20}
                required
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <select
                value={tipe}
                onChange={(e) => setTipe(e.target.value as "pemasukan" | "pengeluaran")}
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!nama.trim()}
              className="bg-[#F7A440] hover:bg-[#e09132] text-white px-3 py-2 rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center min-w-[70px]"
            >
              <span className="material-symbols-outlined">add</span>
              Tambah
            </button>
          </form>

          {/* List Kategori */}
          <div className="flex flex-col gap-2 mt-2">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">Daftar Kategori</h3>
            {loading ? (
              <div className="text-center py-4 text-slate-400 text-sm">Memuat...</div>
            ) : kategoris.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm italic">Belum ada kategori</div>
            ) : (
              kategoris.map(kat => (
                <div key={kat.id} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${kat.tipe === "pemasukan" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                    <span className="text-sm font-semibold text-slate-700">{kat.nama}</span>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full capitalize">{kat.tipe}</span>
                  </div>
                  <button onClick={() => handleDelete(kat.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

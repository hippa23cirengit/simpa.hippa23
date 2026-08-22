"use client"

import React, { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { KasTransaksi } from "@prisma/client"
import { KelolaKategoriModal } from "./components/kelola-kategori-modal"
import { TambahTransaksiModal } from "./components/tambah-transaksi-modal"
import { getCurrentRole, getStoredAcl } from "@/common/lib/mock-db"
import { useDialog } from "@/common/components/dialog-provider"
import { ChartAreaInteractive } from "./components/finance-chart"
import { useKasirSession } from "./hooks/use-kasir-session"
import { KelolaPinModal } from "./components/kelola-pin-modal"
import { UbahPinModal } from "./components/ubah-pin-modal"
import { ExportDropdown } from "@/common/components/export-dropdown"
import { generatePdf } from "@/common/utils/pdf-export-helper"
import { ExportFilterModal, ExportRange } from "./components/export-filter-modal"

export default function KeuanganPage() {
  const { showConfirm, showAlert } = useDialog()
  const [activeTab, setActiveTab] = useState<"dashboard" | "transaksi">("dashboard")
  const [transaksiList, setTransaksiList] = useState<KasTransaksi[]>([])
  const [saldoAwal, setSaldoAwal] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Permissions
  const [canManage, setCanManage] = useState(false)

  // Edit Session
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [isUbahPinModalOpen, setIsUbahPinModalOpen] = useState(false)

  // Modals (declared here so useKasirSession callback can reference them)
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false)
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false)
  const [editData, setEditData] = useState<KasTransaksi | null>(null)
  const [isEditSaldoOpen, setIsEditSaldoOpen] = useState(false)
  const [tempSaldoAwal, setTempSaldoAwal] = useState("")

  const { isKasirMode: isEditUnlocked, activateKasir: unlockEdit, deactivateKasir: lockEdit } = useKasirSession(() => {
    // on timeout, ensure modal is closed if it was open
    setIsTambahModalOpen(false)
    setIsKategoriModalOpen(false)
    setEditData(null)
    showAlert("Sesi edit telah berakhir karena tidak ada aktivitas.", "Sesi Terkunci", "info")
  })

  // Export Modal
  const [isExportFilterOpen, setIsExportFilterOpen] = useState(false)
  const [exportType, setExportType] = useState<"pdf" | "excel">("pdf")

  // Filter
  const [filterBulan, setFilterBulan] = useState<string>("Semua") // YYYY-MM
  const [filterTipe, setFilterTipe] = useState<"Semua" | "pemasukan" | "pengeluaran">("Semua")

  useEffect(() => {
    // Check permission
    const role = getCurrentRole()
    if (role === "Super Admin") {
      setCanManage(true)
    } else {
      const acl = getStoredAcl().find(r => r.role === role)
      if (acl && acl.permissions.manageKeuangan) {
        setCanManage(true)
      }
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resTx, resSetting] = await Promise.all([
        fetch("/api/kas/transaksi"),
        fetch("/api/kas/setting")
      ])
      if (resTx.ok && resSetting.ok) {
        const txData = await resTx.json()
        const settingData = await resSetting.json()
        setTransaksiList(txData)
        setSaldoAwal(settingData.saldoAwal || 0)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSaldoAwal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempSaldoAwal) return

    try {
      const res = await fetch("/api/kas/setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldoAwal: parseInt(tempSaldoAwal.replace(/\D/g, ""), 10) || 0 })
      })
      if (res.ok) {
        setIsEditSaldoOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteTransaksi = async (id: string) => {
    const confirmed = await showConfirm("Hapus transaksi ini?", "Hapus Transaksi", "danger")
    if (!confirmed) return
    try {
      const res = await fetch(`/api/kas/transaksi/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleEditTransaksi = (t: KasTransaksi) => {
    setEditData(t)
    setIsTambahModalOpen(true)
  }

  const formatRp = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num)
  }

  // Analytics
  const totalPemasukan = transaksiList.filter(t => t.tipe === "pemasukan").reduce((sum, t) => sum + t.jumlah, 0)
  const totalPengeluaran = transaksiList.filter(t => t.tipe === "pengeluaran").reduce((sum, t) => sum + t.jumlah, 0)
  const sisaSaldo = saldoAwal + totalPemasukan - totalPengeluaran

  // Filtered List
  const filteredTransaksi = transaksiList.filter(t => {
    const matchTipe = filterTipe === "Semua" || t.tipe === filterTipe
    const matchBulan = filterBulan === "Semua" || t.tanggal.startsWith(filterBulan)
    return matchTipe && matchBulan
  })

  // Formatter for YYYY-MM
  const formatBulan = (ym: string) => {
    const [y, m] = ym.split("-")
    const date = new Date(parseInt(y), parseInt(m) - 1)
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date)
  }

  // Get unique months for filter
  const uniqueMonths = Array.from(new Set(transaksiList.map(t => t.tanggal.substring(0, 7)))).sort().reverse()

  const filterByDateRange = (list: KasTransaksi[], range: ExportRange) => {
    if (range === "semua") return list
    
    const now = new Date()
    let thresholdDate = new Date()

    switch(range) {
      case "1_minggu": thresholdDate.setDate(now.getDate() - 7); break;
      case "4_minggu": thresholdDate.setDate(now.getDate() - 28); break;
      case "8_minggu": thresholdDate.setDate(now.getDate() - 56); break;
      case "12_minggu": thresholdDate.setDate(now.getDate() - 84); break;
      case "1_tahun": thresholdDate.setFullYear(now.getFullYear() - 1); break;
      case "2_tahun": thresholdDate.setFullYear(now.getFullYear() - 2); break;
    }

    const thresholdIso = thresholdDate.toISOString().split("T")[0]
    return list.filter(t => t.tanggal >= thresholdIso)
  }

  const handleExportExcel = (range: ExportRange) => {
    const listToExport = filterByDateRange(filteredTransaksi, range)
    if (listToExport.length === 0) {
      showAlert("Tidak ada data dalam rentang waktu tersebut.", "Data Kosong", "warning")
      return
    }

    const exportData = listToExport.map(t => ({
      Tanggal: t.tanggal,
      Tipe: t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.kategori,
      Keterangan: t.deskripsi,
      Masuk: t.tipe === 'pemasukan' ? t.jumlah : 0,
      Keluar: t.tipe === 'pengeluaran' ? t.jumlah : 0
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi")
    XLSX.writeFile(wb, `Laporan_Kas_${new Date().getTime()}.xlsx`)
  }

  // Export PDF
  const handleExportPdf = async (range: ExportRange) => {
    const listToExport = filterByDateRange(filteredTransaksi, range)
    if (listToExport.length === 0) {
      showAlert("Tidak ada data dalam rentang waktu tersebut.", "Data Kosong", "warning")
      return
    }

    const columns = [
      "No",
      "Tanggal",
      "Kategori",
      "Keterangan",
      "Jumlah (Rp)"
    ]

    let totalMasuk = 0;
    let totalKeluar = 0;

    const pemasukanList = listToExport.filter(t => t.tipe === "pemasukan")
    const pengeluaranList = listToExport.filter(t => t.tipe === "pengeluaran")

    const pemasukanRows = pemasukanList.map((t, index) => {
      totalMasuk += t.jumlah;
      return [
        index + 1,
        t.tanggal,
        t.kategori,
        t.deskripsi || "-",
        t.jumlah.toLocaleString('id-ID')
      ];
    });

    const pengeluaranRows = pengeluaranList.map((t, index) => {
      totalKeluar += t.jumlah;
      return [
        index + 1,
        t.tanggal,
        t.kategori,
        t.deskripsi || "-",
        t.jumlah.toLocaleString('id-ID')
      ];
    });

    const tables = []
    
    if (pemasukanList.length > 0) {
      tables.push({
        subtitle: "A. Tabel Pemasukan",
        columns,
        rows: pemasukanRows
      })
    }

    if (pengeluaranList.length > 0) {
      tables.push({
        subtitle: "B. Tabel Pengeluaran",
        columns,
        rows: pengeluaranRows
      })
    }

    const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

    const summaryRows = [
      ["SALDO AWAL", "", "", "", `Rp ${saldoAwal.toLocaleString('id-ID')}`],
      ["TOTAL PEMASUKAN", "", "", "", `Rp ${totalMasuk.toLocaleString('id-ID')}`],
      ["TOTAL PENGELUARAN", "", "", "", `Rp ${totalKeluar.toLocaleString('id-ID')}`],
      ["SALDO AKHIR", "", "", "", `Rp ${saldoAkhir.toLocaleString('id-ID')}`]
    ];

    let rangeText = "Semua Waktu"
    switch(range) {
      case "1_minggu": rangeText = "1 Minggu Terakhir"; break;
      case "4_minggu": rangeText = "4 Minggu Terakhir"; break;
      case "8_minggu": rangeText = "8 Minggu Terakhir"; break;
      case "12_minggu": rangeText = "12 Minggu Terakhir"; break;
      case "1_tahun": rangeText = "1 Tahun Terakhir"; break;
      case "2_tahun": rangeText = "2 Tahun Terakhir"; break;
    }

    await generatePdf({
      title: "LAPORAN KAS & KEUANGAN ORGANISASI",
      subtitle: `Rentang Filter: ${rangeText}\nTotal Pemasukan: Rp ${totalMasuk.toLocaleString('id-ID')} | Total Pengeluaran: Rp ${totalKeluar.toLocaleString('id-ID')} | Sisa Saldo: Rp ${saldoAkhir.toLocaleString('id-ID')}`,
      tables,
      summaryRows,
      filename: `Laporan_Kas_HIPPA_Cirengit_${new Date().toISOString().split("T")[0]}.pdf`,
    })
  }

  const onProcessExport = (range: ExportRange) => {
    setIsExportFilterOpen(false)
    if (exportType === "pdf") {
      handleExportPdf(range)
    } else {
      handleExportExcel(range)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Kas</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Laporan arus kas dan keuangan organisasi</p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportDropdown 
            onExportExcel={() => { setExportType("excel"); setIsExportFilterOpen(true) }}
            onExportPdf={() => { setExportType("pdf"); setIsExportFilterOpen(true) }}
          />
          {canManage && (
            isEditUnlocked ? (
              <button 
                onClick={lockEdit}
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-200 transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                Akses Edit Aktif
              </button>
            ) : (
              <button 
                onClick={() => setIsPinModalOpen(true)}
                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Buka Akses Edit
              </button>
            )
          )}
          {canManage && isEditUnlocked && (
            <>
              <button 
                onClick={() => setIsUbahPinModalOpen(true)}
                className="text-slate-400 hover:text-amber-500 transition px-2 flex items-center justify-center"
                title="Pengaturan Keamanan PIN"
              >
                <span className="material-symbols-outlined text-[24px]">settings</span>
              </button>
              <button 
                onClick={() => setIsKategoriModalOpen(true)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">category</span>
                Kategori
              </button>
              <button 
                onClick={() => setIsTambahModalOpen(true)}
                className="bg-[#F7A440] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#e09132] transition flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Catat Transaksi
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "border-[#F7A440] text-[#F7A440]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">donut_large</span>
          Dashboard Ringkasan
        </button>
        <button
          onClick={() => setActiveTab("transaksi")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "transaksi"
              ? "border-[#F7A440] text-[#F7A440]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Riwayat Transaksi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === "dashboard" ? (
        /* TAB 1: DASHBOARD */
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Awal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  </div>
                  <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Saldo Awal</h3>
                </div>
                {canManage && isEditUnlocked && (
                  <button onClick={() => { setTempSaldoAwal(saldoAwal.toString()); setIsEditSaldoOpen(true); }} className="text-slate-400 hover:text-blue-600">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                )}
              </div>
              <p className="font-black text-2xl text-slate-800">{formatRp(saldoAwal)}</p>
            </div>

            {/* Total Pemasukan Card */}
            <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-emerald-500">
                <span className="material-symbols-outlined text-8xl">trending_up</span>
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </div>
                <h3 className="font-bold text-emerald-600 text-xs uppercase tracking-wider">Total Pemasukan</h3>
              </div>
              <p className="font-black text-2xl text-slate-800 relative z-10">{formatRp(totalPemasukan)}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{transaksiList.filter(t => t.tipe === "pemasukan").length} Transaksi</p>
            </div>

            {/* Total Pengeluaran Card */}
            <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-rose-500">
                <span className="material-symbols-outlined text-8xl">trending_down</span>
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </div>
                <h3 className="font-bold text-rose-600 text-xs uppercase tracking-wider">Total Pengeluaran</h3>
              </div>
              <p className="font-black text-2xl text-slate-800 relative z-10">{formatRp(totalPengeluaran)}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{transaksiList.filter(t => t.tipe === "pengeluaran").length} Transaksi</p>
            </div>

            {/* Sisa Saldo Card */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-5 shadow-md relative overflow-hidden text-white">
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <span className="material-symbols-outlined text-8xl">savings</span>
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-white">wallet</span>
                </div>
                <h3 className="font-bold text-amber-50 text-xs uppercase tracking-wider">Sisa Saldo Kas</h3>
              </div>
              <p className="font-black text-3xl relative z-10">{formatRp(sisaSaldo)}</p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500">info</span>
            <p className="text-sm font-medium text-amber-800 leading-snug">
              Pastikan Anda mencatat setiap pengeluaran dan pemasukan dengan teliti. Angka <strong className="font-black">Sisa Saldo Kas</strong> harus sama dengan jumlah uang fisik atau saldo rekening bank organisasi Anda saat ini.
            </p>
          </div>

          <div className="mt-4">
            <ChartAreaInteractive transaksiList={transaksiList} saldoAwal={saldoAwal} />
          </div>
        </div>
      ) : (
        /* TAB 2: TRANSAKSI */
        <div className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <select 
                value={filterTipe} 
                onChange={(e) => setFilterTipe(e.target.value as any)}
                className="text-sm font-semibold border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50 px-3 py-1.5"
              >
                <option value="Semua">Semua Tipe</option>
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
              <select 
                value={filterBulan} 
                onChange={(e) => setFilterBulan(e.target.value)}
                className="text-sm font-semibold border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50 px-3 py-1.5"
              >
                <option value="Semua">Semua Waktu</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>{formatBulan(m)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Tipe</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Keterangan</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Nominal</th>
                    {canManage && isEditUnlocked && <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={canManage && isEditUnlocked ? 6 : 5} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data transaksi.
                      </td>
                    </tr>
                  ) : (
                    filteredTransaksi.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">{t.tanggal}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.tipe === 'pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            <span className="material-symbols-outlined text-[12px]">
                              {t.tipe === 'pemasukan' ? 'arrow_downward' : 'arrow_upward'}
                            </span>
                            {t.tipe}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-600 whitespace-nowrap">{t.kategori}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 line-clamp-2 max-w-[300px]">{t.deskripsi}</td>
                        <td className={`py-3 px-4 text-sm font-bold text-right whitespace-nowrap ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {t.tipe === 'pemasukan' ? '+' : '-'}{formatRp(t.jumlah)}
                        </td>
                        {canManage && isEditUnlocked && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleEditTransaksi(t)}
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition"
                                title="Edit Transaksi"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaksi(t.id)}
                                className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition"
                                title="Hapus Transaksi"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Saldo Awal Modal */}
      {isEditSaldoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <form onSubmit={handleUpdateSaldoAwal} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">Set Saldo Awal</h2>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nominal Saldo (Rp)</label>
              <input
                type="text"
                required
                value={tempSaldoAwal ? new Intl.NumberFormat('id-ID').format(Number(tempSaldoAwal.replace(/\D/g, ""))) : ""}
                onChange={(e) => setTempSaldoAwal(e.target.value.replace(/\D/g, ""))}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsEditSaldoOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200">Batal</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* Other Modals */}
      <KelolaKategoriModal 
        isOpen={isKategoriModalOpen} 
        onClose={() => setIsKategoriModalOpen(false)} 
        onUpdated={() => {}} // No strict need to re-fetch main page on category update
      />
      <TambahTransaksiModal 
        isOpen={isTambahModalOpen} 
        onClose={() => {
          setIsTambahModalOpen(false)
          setEditData(null)
        }} 
        onSuccess={fetchData}
        editData={editData}
      />
      <KelolaPinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={() => {
          setIsPinModalOpen(false)
          unlockEdit()
        }} 
      />
      <UbahPinModal 
        isOpen={isUbahPinModalOpen}
        onClose={() => setIsUbahPinModalOpen(false)}
      />
      <ExportFilterModal
        isOpen={isExportFilterOpen}
        onClose={() => setIsExportFilterOpen(false)}
        onExport={onProcessExport}
        exportType={exportType}
      />
    </div>
  )
}

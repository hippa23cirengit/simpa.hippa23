"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getCurrentRole,
  getStoredAcl,
  getWaTemplate,
  saveWaTemplate,
  getWaConfig,
  saveWaConfig,
  getPeriodeJabatan,
  savePeriodeJabatan,
  WaConfig
} from "@/common/lib/mock-db"

export default function PengaturanPage() {
  const [currentRole, setCurrentRole] = useState("Super Admin")
  const [template, setTemplate] = useState("")
  const [isSaved, setIsSaved] = useState(false)
  const [isConfigSaved, setIsConfigSaved] = useState(false)
  const [isPeriodeSaved, setIsPeriodeSaved] = useState(false)

  // Wa Config State
  const [waConfig, setWaConfig] = useState<WaConfig>({
    endpoint: "https://api.fonnte.com/send",
    deviceId: "instance-fonnte-cirengit",
    token: "t0k3n-s3cr3t-fonnt3-c1r3ng1t"
  })

  // Periode Jabatan State
  const [periodeJabatan, setPeriodeJabatanInput] = useState("2026 - 2028")

  // Test message states
  const [testPhone, setTestPhone] = useState("")
  const [testSent, setTestSent] = useState(false)

  const loadData = () => {
    const role = getCurrentRole()
    setCurrentRole(role)
    setTemplate(getWaTemplate())
    setWaConfig(getWaConfig())
    setPeriodeJabatanInput(getPeriodeJabatan())
  }

  useEffect(() => {
    loadData()

    const handleRoleChange = () => {
      loadData()
    }
    window.addEventListener("simpa_role_changed", handleRoleChange)
    return () => {
      window.removeEventListener("simpa_role_changed", handleRoleChange)
    }
  }, [])

  // Authorization check via ACL managePengaturan or viewPengaturan
  const activeAcl = getStoredAcl().find(r => r.role === currentRole)
  const hasAccess = currentRole === "Super Admin" || !!activeAcl?.permissions.viewPengaturan
  const canManage = currentRole === "Super Admin" || !!activeAcl?.permissions.managePengaturan

  const handleSaveTemplate = () => {
    if (!canManage) return
    saveWaTemplate(template)
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
    }, 3000)
  }

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    saveWaConfig(waConfig)
    setIsConfigSaved(true)
    setTimeout(() => {
      setIsConfigSaved(false)
    }, 3000)
  }

  const handleSavePeriode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    savePeriodeJabatan(periodeJabatan.trim())
    setIsPeriodeSaved(true)
    setTimeout(() => {
      setIsPeriodeSaved(false)
    }, 3000)
  }

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone.trim()) return
    
    setTestSent(true)
    setTimeout(() => {
      setTestSent(false)
      alert(`Pesan uji coba berhasil dikirim ke nomor ${testPhone} melalui gateway (${waConfig.endpoint})!`)
    }, 1200)
  }

  // Parse template variables for mockup preview
  const getPreviewText = (rawTemplate: string) => {
    if (!rawTemplate) return ""
    return rawTemplate
      .replace(/\{\{NAMA\}\}/g, "Budi Santoso")
      .replace(/\{\{KEGIATAN\}\}/g, "Bakti Sosial & Pembagian Air")
      .replace(/\{\{JAM\}\}/g, "08:00")
      .replace(/\{\{LOKASI\}\}/g, "Kawasan RW 05 Desa Cirengit")
  }

  // Render WhatsApp formatting (*bold*, _italic_) to HTML Elements
  const renderWaFormattedText = (text: string) => {
    const lines = text.split("\n")
    return lines.map((line, lineIdx) => {
      return (
        <div key={lineIdx} className="min-h-[1.25rem]">
          {line.split(" ").map((word, wordIdx) => {
            let isBold = word.startsWith("*") && word.endsWith("*")
            let isItalic = word.startsWith("_") && word.endsWith("_")
            let cleanWord = word
            if (isBold) cleanWord = word.slice(1, -1)
            if (isItalic) cleanWord = word.slice(1, -1)

            return (
              <span key={wordIdx} className={`${isBold ? "font-bold" : ""} ${isItalic ? "italic" : ""} mr-1`}>
                {cleanWord}
              </span>
            )
          })}
        </div>
      )
    })
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-6">
        <div className="w-24 h-24 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[48px]">block</span>
        </div>
        <div className="space-y-2">
          <h3 className="font-headline-md text-xl font-bold text-slate-800">Akses Ditolak (403)</h3>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Role Anda ({currentRole}) tidak memiliki izin untuk mengakses menu Pengaturan Sistem.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Pengaturan Sistem</h2>
        <p className="font-body-md text-sm text-slate-500 mt-1">Konfigurasi integrasi Whatsapp API Gateway & parameter organisasi Himpunan.</p>
      </div>

      {/* Periode Jabatan Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F7A440]">calendar_month</span>
            Pengaturan Periode Kepengurusan
          </h3>
          {isPeriodeSaved && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Periode Disimpan!
            </span>
          )}
        </div>
        <form onSubmit={handleSavePeriode} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periode Jabatan Tasykil</label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={periodeJabatan}
              onChange={(e) => setPeriodeJabatanInput(e.target.value)}
              placeholder="Contoh: 2026 - 2028"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          {canManage && (
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2C2C2C] active:bg-[#000] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm shrink-0"
            >
              Simpan Periode
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: WhatsApp Status & Info */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-title-lg text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#F7A440]">sensors</span>
              Status WhatsApp Gateway
            </h3>
            <div className="space-y-4">
              {/* Status Pill */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="text-sm font-bold text-emerald-800">Terhubung (Tersimpan)</span>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase">Online</span>
              </div>

              {/* Device metadata */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span>Instance ID</span>
                  <span className="text-slate-800 font-bold font-mono">{waConfig.deviceId}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span>Endpoint URL</span>
                  <span className="text-slate-800 font-bold font-mono text-[11px] truncate max-w-[180px]">{waConfig.endpoint}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span>Status Koneksi Server</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] fill">check_circle</span>
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <button
              type="button"
              onClick={() => alert("Koneksi API WhatsApp Gateway telah diperiksa dan berfungsi dengan baik.")}
              className="w-full py-2.5 px-4 text-center text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition duration-200 flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Cek Koneksi
            </button>
          </div>
        </div>

        {/* Right Column: API Configuration Form */}
        <form onSubmit={handleSaveConfig} className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F7A440]">api</span>
                Konfigurasi API Gateway
              </h3>
              {isConfigSaved && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Config Disimpan!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">API URL Endpoint</label>
                <input
                  type="text"
                  required
                  disabled={!canManage}
                  value={waConfig.endpoint}
                  onChange={(e) => setWaConfig({ ...waConfig, endpoint: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Device ID / Instance ID</label>
                  <input
                    type="text"
                    required
                    disabled={!canManage}
                    value={waConfig.deviceId}
                    onChange={(e) => setWaConfig({ ...waConfig, deviceId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">API Token / Secret Key</label>
                  <input
                    type="password"
                    required
                    disabled={!canManage}
                    value={waConfig.token}
                    onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
          {canManage && (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm"
              >
                Simpan Konfigurasi
              </button>
            </div>
          )}
        </form>
      </div>

      {/* WhatsApp Notification Template Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F7A440]">edit_note</span>
                Template Pesan Notifikasi Otomatis
              </h3>
              {isSaved && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Disimpan!
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Kustomisasi template pengingat jadwal kegiatan otomatis. Gunakan variabel dinamis berikut untuk merender data kegiatan secara otomatis:
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{NAMA}}"} = Nama Anggota</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{KEGIATAN}}"} = Nama Kegiatan</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{JAM}}"} = Jam Kegiatan</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{LOKASI}}"} = Tempat Kegiatan</span>
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <textarea
                disabled={!canManage}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={8}
                className="w-full border border-slate-200 rounded-lg p-3.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors resize-none leading-relaxed"
                placeholder="Tulis template pesan di sini..."
              />
            </div>
          </div>
          
          {canManage && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-5 py-2.5 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Simpan Template
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Real-time Chat Bubble Preview (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className="bg-[#075e54] text-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#128c7e] text-white flex items-center justify-center font-bold text-xs">
              SP
            </div>
            <div>
              <h4 className="text-xs font-bold leading-none">SIMPA Broadcast Bot</h4>
              <p className="text-[9px] text-[#25d366] font-bold mt-1">Online</p>
            </div>
          </div>

          {/* Chat Window Canvas */}
          <div className="flex-grow p-4 bg-[#efeae2] min-h-[300px] flex flex-col justify-end">
            {/* Message bubble */}
            <div className="bg-white rounded-xl rounded-tr-none p-3 max-w-[85%] self-end shadow-sm border border-slate-200 relative text-xs text-slate-800 leading-relaxed font-sans">
              {renderWaFormattedText(getPreviewText(template))}
              <div className="text-[9px] text-slate-400 font-bold text-right mt-1">
                06:00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Tester Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="font-title-lg text-base font-bold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
          <span className="material-symbols-outlined text-[#F7A440]">send</span>
          Uji Coba Pengiriman Pesan
        </h3>
        <form onSubmit={handleSendTest} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor Penerima</label>
            <input
              type="text"
              required
              placeholder="Contoh: 0812XXXXXXXX"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
            />
          </div>
          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Isi Pesan Uji Coba</label>
            <input
              type="text"
              readOnly
              value="[SIMPA HIPPA] Halo! Ini adalah pesan uji coba sistem notifikasi otomatis WhatsApp."
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2 w-full">
            <button
              type="submit"
              disabled={testSent}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center justify-center gap-1.5 h-[42px] disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              {testSent ? "Mengirim..." : "Kirim Uji Coba"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getCurrentRole,
  getStoredAcl,
  getWaTemplateKajian,
  saveWaTemplateKajian,
  getWaTemplateUmum,
  saveWaTemplateUmum,
  getWaConfig,
  saveWaConfig,
  getPeriodeJabatan,
  savePeriodeJabatan,
  WaConfig
} from "@/common/lib/mock-db"
import { customAlert, customConfirm } from "@/common/lib/alert"

export default function PengaturanPage() {
  const [currentRole, setCurrentRole] = useState("Super Admin")
  const [templateKajian, setTemplateKajian] = useState("")
  const [templateUmum, setTemplateUmum] = useState("")
  const [activeTemplateTab, setActiveTemplateTab] = useState<"kajian" | "umum">("kajian")
  
  const [isSaved, setIsSaved] = useState(false)
  const [isConfigSaved, setIsConfigSaved] = useState(false)
  const [isPeriodeSaved, setIsPeriodeSaved] = useState(false)

  // Wa Config State
  const [waConfig, setWaConfig] = useState<WaConfig>({
    endpoint: "https://api.fonnte.com/send",
    deviceId: "instance-fonnte-cirengit",
    token: ""
  })

  // Live Device Connection State
  const [deviceInfo, setDeviceInfo] = useState<{
    checking: boolean;
    connected: boolean;
    deviceNumber: string;
    deviceName: string;
    reason: string;
  }>({
    checking: true,
    connected: false,
    deviceNumber: "-",
    deviceName: "-",
    reason: "Memeriksa status koneksi server..."
  })

  // Periode Jabatan State
  const [periodeJabatan, setPeriodeJabatanInput] = useState("2026 - 2028")

  // Test message states
  const [testPhone, setTestPhone] = useState("")
  const [testSent, setTestSent] = useState(false)

  const [showToken, setShowToken] = useState(false)

  const checkLiveConnection = async (cfgToTest?: WaConfig) => {
    const targetCfg = cfgToTest || waConfig
    setDeviceInfo((prev) => ({ ...prev, checking: true }))

    try {
      const res = await fetch("/api/check-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: targetCfg.token,
          endpoint: targetCfg.endpoint
        })
      })

      const data = await res.json()

      if (data.status === true || data.device_status === "connect") {
        setDeviceInfo({
          checking: false,
          connected: true,
          deviceNumber: data.device || data.phone || targetCfg.deviceId || "-",
          deviceName: data.name || targetCfg.deviceId || "Fonnte Device",
          reason: "Terhubung"
        })
      } else {
        setDeviceInfo({
          checking: false,
          connected: false,
          deviceNumber: "-",
          deviceName: "-",
          reason: data.reason || data.detail || "Terputus / Token Tidak Valid"
        })
      }
    } catch (err: any) {
      setDeviceInfo({
        checking: false,
        connected: false,
        deviceNumber: "-",
        deviceName: "-",
        reason: err.message || "Gagal menghubungi endpoint"
      })
    }
  }

  const loadData = () => {
    const role = getCurrentRole()
    setCurrentRole(role)
    setTemplateKajian(getWaTemplateKajian())
    setTemplateUmum(getWaTemplateUmum())
    const cfg = getWaConfig()
    setWaConfig(cfg)
    setPeriodeJabatanInput(getPeriodeJabatan())

    // Perform live connection check on mount
    checkLiveConnection(cfg)
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
  const activeAcl = getStoredAcl().find((r) => r.role === currentRole)
  const hasAccess = currentRole === "Super Admin" || !!activeAcl?.permissions.viewPengaturan
  const canManage = currentRole === "Super Admin" || !!activeAcl?.permissions.managePengaturan

  const handleSaveTemplate = async () => {
    if (!canManage) return
    const confirmed = await customConfirm({
      title: "Simpan Template Pesan",
      message: `Apakah Anda yakin ingin memperbarui template WhatsApp untuk pesan broadcast ${activeTemplateTab === "kajian" ? "Kajian" : "Umum"}?`,
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    if (activeTemplateTab === "kajian") {
      saveWaTemplateKajian(templateKajian)
    } else {
      saveWaTemplateUmum(templateUmum)
    }
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
    }, 3000)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    const confirmed = await customConfirm({
      title: "Simpan Konfigurasi WA Gateway",
      message: "Apakah Anda yakin ingin memperbarui token dan endpoint WhatsApp Gateway (Fonnte)? Pastikan token Fonnte Anda valid.",
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    saveWaConfig(waConfig)
    setIsConfigSaved(true)

    // Instantly check live connection with updated config
    checkLiveConnection(waConfig)

    setTimeout(() => {
      setIsConfigSaved(false)
    }, 3000)
  }

  const handleSavePeriode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    const confirmed = await customConfirm({
      title: "Simpan Periode Jabatan",
      message: `Apakah Anda yakin ingin memperbarui periode jabatan kepengurusan menjadi "${periodeJabatan.trim()}"?`,
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    savePeriodeJabatan(periodeJabatan.trim())
    setIsPeriodeSaved(true)
    setTimeout(() => {
      setIsPeriodeSaved(false)
    }, 3000)
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone.trim()) return

    setTestSent(true)

    try {
      const activeTemplate = activeTemplateTab === "kajian" ? templateKajian : templateUmum
      const response = await fetch("/api/send-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: testPhone,
          message: getPreviewText(activeTemplate),
          token: waConfig.token,
          endpoint: waConfig.endpoint
        })
      })

      const resData = await response.json()
      setTestSent(false)

      if (resData.status === true || resData.status === "true") {
        await customAlert({
          type: "success",
          title: "Pesan Terkirim",
          message: `✅ Pesan WhatsApp BERHASIL dikirim ke nomor ${testPhone}!\n\nStatus Fonnte: OK`
        })
      } else {
        const errorDetail = resData.reason || resData.detail || resData.message || JSON.stringify(resData)
        await customAlert({
          type: "error",
          title: "Pengiriman Gagal",
          message: `⚠️ Respon dari Fonnte WA Gateway: GAGAL\n\nAlasan: ${errorDetail}\n\nPastikan:\n1. Token Fonnte di atas sudah sesuai dan diklik 'Simpan Konfigurasi'\n2. Status Device di Fonnte (md.fonnte.com) sudah 'Connected' (hijau)`
        })
      }
    } catch (err: any) {
      setTestSent(false)
      await customAlert({
        type: "error",
        title: "Kesalahan Koneksi",
        message: `Terjadi kesalahan koneksi server: ${err.message || err}`
      })
    }
  }

  // Parse template variables for mockup preview
  const getPreviewText = (rawTemplate: string) => {
    if (!rawTemplate) return ""
    if (activeTemplateTab === "kajian") {
      return rawTemplate
        .replace(/\{\{NAMA\}\}/g, "Budi Santoso")
        .replace(/\{\{KEGIATAN\}\}/g, "Peran Pemuda di Era Digital")
        .replace(/\{\{PEMATERI\}\}/g, "Ustadz Hanan Attaki")
        .replace(/\{\{TEMA\}\}/g, "Fikih Dakwah Pemuda")
        .replace(/\{\{TANGGAL\}\}/g, "Sabtu, 22 Agustus 2026")
        .replace(/\{\{JAM\}\}/g, "19:30")
        .replace(/\{\{LOKASI\}\}/g, "Masjid Al-Ikhlas Cirengit")
    } else {
      return rawTemplate
        .replace(/\{\{NAMA\}\}/g, "Budi Santoso")
        .replace(/\{\{KEGIATAN\}\}/g, "Olahraga Futsal Rutin Pemuda")
        .replace(/\{\{TANGGAL\}\}/g, "Minggu, 23 Agustus 2026")
        .replace(/\{\{JAM\}\}/g, "16:00")
        .replace(/\{\{LOKASI\}\}/g, "Futsal Center Cirengit")
    }
  }

  // Render WhatsApp formatting (*bold*, _italic_) to HTML Elements
  const renderWaFormattedText = (text: string) => {
    const lines = text.split("\n")
    return lines.map((line, lineIdx) => {
      return (
        <div key={lineIdx} className="min-h-[1.25rem] break-words">
          {line.split(" ").map((word, wordIdx) => {
            let isBold = word.startsWith("*") && word.endsWith("*")
            let isItalic = word.startsWith("_") && word.endsWith("_")
            let cleanWord = word
            if (isBold) cleanWord = word.slice(1, -1)
            if (isItalic) cleanWord = word.slice(1, -1)

            return (
              <span key={wordIdx} className={`${isBold ? "font-bold" : ""} ${isItalic ? "italic" : ""}`}>
                {cleanWord}{" "}
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
        <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">
          Pengaturan Sistem
        </h2>
        <p className="font-body-md text-sm text-slate-500 mt-1">
          Konfigurasi integrasi Whatsapp API Gateway & parameter organisasi Himpunan.
        </p>
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
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Periode Jabatan Tasykil
            </label>
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
        {/* Left Column: Real Live WhatsApp Device Connection Status */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-title-lg text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#F7A440]">sensors</span>
              Status WhatsApp Gateway (Live)
            </h3>
            <div className="space-y-4">
              {/* Dynamic Status Pill */}
              {deviceInfo.checking ? (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-xs font-bold text-slate-600">Memeriksa koneksi server...</span>
                  </div>
                </div>
              ) : deviceInfo.connected ? (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-800">Terhubung Live</span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    Online
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 p-3.5 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                      <span className="text-xs font-bold text-red-800">Terputus / Unreachable</span>
                    </div>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                      Offline
                    </span>
                  </div>
                  <p className="text-[10px] text-red-600 font-medium leading-snug">
                    Respon Fonnte: {deviceInfo.reason}
                  </p>
                </div>
              )}

              {/* Device metadata */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span>Device Name / Label</span>
                  <span className="text-slate-800 font-bold">{deviceInfo.deviceName}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span>Nomor HP Bot</span>
                  <span className="text-slate-800 font-bold font-mono">{deviceInfo.deviceNumber}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span>Endpoint URL</span>
                  <span className="text-slate-800 font-bold font-mono text-[11px] truncate max-w-[180px]">
                    {waConfig.endpoint}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <button
              type="button"
              onClick={() => checkLiveConnection()}
              disabled={deviceInfo.checking}
              className="w-full py-2.5 px-4 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${deviceInfo.checking ? "animate-spin" : ""}`}>
                sync
              </span>
              {deviceInfo.checking ? "Memeriksa..." : "Cek Koneksi Live"}
            </button>
          </div>
        </div>

        {/* Right Column: API Configuration Form */}
        <form
          onSubmit={handleSaveConfig}
          className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between"
        >
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  API URL Endpoint
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManage}
                  value={waConfig.endpoint}
                  onChange={(e) => setWaConfig({ ...waConfig, endpoint: e.target.value })}
                  placeholder="https://api.fonnte.com/send"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 font-mono focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Device ID / Instance ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canManage}
                    value={waConfig.deviceId}
                    onChange={(e) => setWaConfig({ ...waConfig, deviceId: e.target.value })}
                    placeholder="Contoh: Bot HIPPA"
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    API Token / Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      required
                      disabled={!canManage}
                      value={waConfig.token}
                      onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                      placeholder="Masukkan Token dari md.fonnte.com"
                      className="w-full border border-slate-200 rounded-lg pl-3.5 pr-10 py-2 font-body-md text-sm text-slate-800 font-mono focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showToken ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
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
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
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

            {/* Template Selection Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTemplateTab("kajian")}
                className={`py-2 px-4 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                  activeTemplateTab === "kajian"
                    ? "border-[#F7A440] text-[#F7A440]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📚 Templat Kajian (Pemateri)
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab("umum")}
                className={`py-2 px-4 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                  activeTemplateTab === "umum"
                    ? "border-[#F7A440] text-[#F7A440]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                🏃‍♂️ Templat Kegiatan Umum
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Kustomisasi template pengingat jadwal kegiatan otomatis. Gunakan variabel dinamis berikut untuk merender data kegiatan secara otomatis:
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{NAMA}}"} = Nama Anggota</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{KEGIATAN}}"} = Nama Kegiatan</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{TANGGAL}}"} = Hari & Tanggal</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{JAM}}"} = Jam Kegiatan</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{"{{LOKASI}}"} = Tempat Kegiatan</span>
              {activeTemplateTab === "kajian" && (
                <>
                  <span className="px-1.5 py-0.5 bg-white border border-[#F7A440] text-[#895200] rounded">{"{{PEMATERI}}"} = Nama Pemateri</span>
                  <span className="px-1.5 py-0.5 bg-white border border-[#F7A440] text-[#895200] rounded">{"{{TEMA}}"} = Tema Kajian</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <textarea
                disabled={!canManage}
                value={activeTemplateTab === "kajian" ? templateKajian : templateUmum}
                onChange={(e) => {
                  if (activeTemplateTab === "kajian") {
                    setTemplateKajian(e.target.value)
                  } else {
                    setTemplateUmum(e.target.value)
                  }
                }}
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
                Simpan Template {activeTemplateTab === "kajian" ? "Kajian" : "Umum"}
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
            <div className="bg-white rounded-xl rounded-tr-none p-3 max-w-[85%] self-end shadow-sm border border-slate-200 relative text-xs text-slate-800 leading-relaxed font-sans break-words whitespace-pre-wrap">
              {renderWaFormattedText(getPreviewText(activeTemplateTab === "kajian" ? templateKajian : templateUmum))}
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
              value={activeTemplateTab === "kajian" ? "[Template Kajian] Kajian Rutin Pemuda Akhir Zaman..." : "[Template Umum] Olahraga Futsal Rutin Pemuda..."}
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

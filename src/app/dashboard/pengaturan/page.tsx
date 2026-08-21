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
import { customAlert, customConfirm, showToast } from "@/common/lib/alert"

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
    provider: "fonnte",
    endpoint: "https://api.fonnte.com/send",
    deviceId: "instance-fonnte-cirengit",
    token: "",
    metaToken: "",
    metaPhoneId: "",
    metaTemplateWelcome: "welcome_simpa",
    metaTemplateKajian: "event_kajian",
    metaTemplateUmum: "event_umum"
  })

  // Live Device Connection State
  const [deviceInfo, setDeviceInfo] = useState<{
    checking: boolean;
    connected: boolean;
    deviceNumber: string;
    deviceName: string;
    reason: string;
    qrUrl?: string | null;
  }>({
    checking: true,
    connected: false,
    deviceNumber: "-",
    deviceName: "-",
    reason: "Memeriksa status koneksi server...",
    qrUrl: null
  })

  // Periode Jabatan State
  const [periodeJabatan, setPeriodeJabatanInput] = useState("2026 - 2028")

  // Test message states
  const [testPhone, setTestPhone] = useState("")
  const [testSent, setTestSent] = useState(false)

  const [showToken, setShowToken] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestartGateway = async () => {
    if (!canManage) return
    const confirmed = await customConfirm({
      title: "Restart Server Gateway",
      message: "Apakah Anda yakin ingin memuat ulang (restart) server gateway? Browser virtual akan dijalankan kembali tetapi sesi masuk (login) tetap dipertahankan.",
      type: "warning",
      confirmText: "Ya, Restart",
      cancelText: "Batal"
    })

    if (!confirmed) return

    setIsRestarting(true)
    showToast({ message: "Mengirim perintah restart ke server...", type: "info" })

    try {
      const res = await fetch("/api/restart-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: waConfig.token,
          endpoint: waConfig.endpoint
        })
      })
      const data = await res.json()
      if (data.status === true) {
        showToast({ message: "Server berhasil direstart! Menunggu inisialisasi ulang...", type: "success" })
        setTimeout(() => {
          setIsRestarting(false)
          checkLiveConnection(waConfig)
        }, 5000)
      } else {
        setIsRestarting(false)
        await customAlert({
          type: "error",
          title: "Gagal Restart",
          message: `Gagal merestart server: ${data.reason || "Alasan tidak diketahui"}`
        })
      }
    } catch (err: any) {
      setIsRestarting(false)
      await customAlert({
        type: "error",
        title: "Kesalahan Koneksi",
        message: `Gagal menghubungi API restart: ${err.message}`
      })
    }
  }

  const handleLogoutGateway = async () => {
    if (!canManage) return
    const confirmed = await customConfirm({
      title: "Keluar Sesi & Tautkan Ulang",
      message: "Apakah Anda yakin ingin mengeluarkan (logout) sesi WhatsApp saat ini dan mereset gateway? Sesi lama akan dihapus dan Anda harus melakukan scan QR Code baru.",
      type: "warning",
      confirmText: "Ya, Reset Sesi",
      cancelText: "Batal"
    })

    if (!confirmed) return

    setIsRestarting(true)
    showToast({ message: "Mengeluarkan sesi dan mereset gateway...", type: "info" })

    try {
      const res = await fetch("/api/logout-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: waConfig.token,
          endpoint: waConfig.endpoint
        })
      })
      const data = await res.json()
      if (data.status === true) {
        showToast({ message: "Sesi berhasil dihapus! Menunggu QR Code baru...", type: "success" })
        setTimeout(() => {
          setIsRestarting(false)
          checkLiveConnection(waConfig)
        }, 5000)
      } else {
        setIsRestarting(false)
        await customAlert({
          type: "error",
          title: "Gagal Reset",
          message: `Gagal mereset sesi: ${data.reason || "Alasan tidak diketahui"}`
        })
      }
    } catch (err: any) {
      setIsRestarting(false)
      await customAlert({
        type: "error",
        title: "Kesalahan Koneksi",
        message: `Gagal menghubungi API reset: ${err.message}`
      })
    }
  }

  const checkLiveConnection = async (cfgToTest?: WaConfig) => {
    const targetCfg = cfgToTest || waConfig
    setDeviceInfo((prev) => ({ ...prev, checking: true }))

    try {
      const res = await fetch("/api/check-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: targetCfg.provider || "fonnte",
          token: targetCfg.token,
          endpoint: targetCfg.endpoint,
          metaToken: targetCfg.metaToken || "",
          metaPhoneId: targetCfg.metaPhoneId || ""
        })
      })

      const data = await res.json()

      if (data.status === true || data.device_status === "connect") {
        setDeviceInfo({
          checking: false,
          connected: true,
          deviceNumber: data.device || data.phone || data.device_number || targetCfg.deviceId || "-",
          deviceName: data.name || data.device_name || targetCfg.deviceId || "WhatsApp Device",
          reason: data.reason || "Terhubung sukses",
          qrUrl: data.qr_url || null
        })
      } else {
        setDeviceInfo({
          checking: false,
          connected: false,
          deviceNumber: "-",
          deviceName: "-",
          reason: data.reason || data.detail || "Terputus / Token Tidak Valid",
          qrUrl: data.qr_url || null
        })
      }
    } catch (err: any) {
      setDeviceInfo({
        checking: false,
        connected: false,
        deviceNumber: "-",
        deviceName: "-",
        reason: err.message || "Gagal menghubungi endpoint",
        qrUrl: null
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
    showToast({
      message: `Template WhatsApp (${activeTemplateTab === "kajian" ? "Kajian" : "Umum"}) berhasil disimpan!`,
      type: "success"
    })
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
    showToast({
      message: "Konfigurasi WA Gateway berhasil disimpan!",
      type: "success"
    })

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
    showToast({
      message: "Periode jabatan kepengurusan berhasil disimpan!",
      type: "success"
    })
    setTimeout(() => {
      setIsPeriodeSaved(false)
    }, 3000)
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) {
      showToast({
        message: "Anda tidak memiliki izin untuk mengirim pesan uji coba.",
        type: "error"
      })
      return
    }
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
          provider: waConfig.provider || "fonnte",
          token: waConfig.token,
          endpoint: waConfig.endpoint,
          metaToken: waConfig.metaToken || "",
          metaPhoneId: waConfig.metaPhoneId || "",
          metaTemplateName: activeTemplateTab === "kajian" ? (waConfig.metaTemplateKajian || "event_kajian") : (waConfig.metaTemplateUmum || "event_umum"),
          metaTemplateLanguage: "id",
          metaParams: activeTemplateTab === "kajian"
            ? ["Budi Santoso", "Peran Pemuda di Era Digital", "Ustadz Hanan Attaki", "Fikih Dakwah Pemuda", "Sabtu, 22 Agustus 2026", "19:30", "Masjid Al-Ikhlas Cirengit"]
            : ["Budi Santoso", "Olahraga Futsal Rutin Pemuda", "Minggu, 23 Agustus 2026", "16:00", "Futsal Center Cirengit"]
        })
      })

      const resData = await response.json()
      setTestSent(false)

      const activeProvider = waConfig.provider || "fonnte"

      if (resData.status === true || resData.status === "true") {
        await customAlert({
          type: "success",
          title: "Pesan Terkirim",
          message: `✅ Pesan WhatsApp BERHASIL dikirim ke nomor ${testPhone} via ${
            activeProvider === "self-hosted" ? "Self-Hosted Gateway" : activeProvider === "meta" ? "Meta Cloud API" : "Fonnte"
          }!`
        })
      } else {
        const errorDetail = resData.reason || resData.detail || resData.message || JSON.stringify(resData)
        let providerName = "Fonnte"
        let tips = "Pastikan:\n1. Token Fonnte di atas sudah sesuai dan diklik 'Simpan Konfigurasi'\n2. Status Device di Fonnte (md.fonnte.com) sudah 'Connected' (hijau)"
        
        if (activeProvider === "self-hosted") {
          providerName = "Self-Hosted"
          tips = "Pastikan:\n1. Server Gateway lokal Anda sudah berjalan (`node server.js`)\n2. Status WhatsApp Web di server lokal Anda sudah Ready/Connected\n3. Token pengaman sudah cocok"
        } else if (activeProvider === "meta") {
          providerName = "Meta Cloud API"
          tips = "Pastikan:\n1. Meta Access Token dan Phone Number ID sudah terisi dengan benar\n2. Nama Template Pesan sudah terdaftar dan disetujui di Meta Business Manager"
        }

        await customAlert({
          type: "error",
          title: "Pengiriman Gagal",
          message: `⚠️ Respon dari ${providerName} WA Gateway: GAGAL\n\nAlasan: ${errorDetail}\n\n${tips}`
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
    
    const replaceHelper = (tpl: string, isKajian: boolean) => {
      let res = tpl
        .replace(/\{\{NAMA\}\}/gi, "Budi Santoso")
        .replace(/\{NAMA\}/gi, "Budi Santoso")
        .replace(/\{\{KEGIATAN\}\}/gi, isKajian ? "Peran Pemuda di Era Digital" : "Olahraga Futsal Rutin Pemuda")
        .replace(/\{KEGIATAN\}/gi, isKajian ? "Peran Pemuda di Era Digital" : "Olahraga Futsal Rutin Pemuda")
        .replace(/\{\{TANGGAL\}\}/gi, isKajian ? "Sabtu, 22 Agustus 2026" : "Minggu, 23 Agustus 2026")
        .replace(/\{TANGGAL\}/gi, isKajian ? "Sabtu, 22 Agustus 2026" : "Minggu, 23 Agustus 2026")
        .replace(/\{\{JAM\}\}/gi, isKajian ? "19:30" : "16:00")
        .replace(/\{JAM\}/gi, isKajian ? "19:30" : "16:00")
        .replace(/\{\{WAKTU\}\}/gi, isKajian ? "19:30" : "16:00")
        .replace(/\{WAKTU\}/gi, isKajian ? "19:30" : "16:00")
        .replace(/\{\{LOKASI\}\}/gi, isKajian ? "Masjid Al-Ikhlas Cirengit" : "Futsal Center Cirengit")
        .replace(/\{LOKASI\}/gi, isKajian ? "Masjid Al-Ikhlas Cirengit" : "Futsal Center Cirengit");
        
      if (isKajian) {
        res = res
          .replace(/\{\{PEMATERI\}\}/gi, "Ustadz Hanan Attaki")
          .replace(/\{PEMATERI\}/gi, "Ustadz Hanan Attaki")
          .replace(/\{\{TEMA\}\}/gi, "Fikih Dakwah Pemuda")
          .replace(/\{TEMA\}/gi, "Fikih Dakwah Pemuda");
      }
      return res;
    }
    
    return replaceHelper(rawTemplate, activeTemplateTab === "kajian");
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
                    Respon Gateway: {deviceInfo.reason}
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

              {/* QR Code display inside settings dashboard */}
              {!deviceInfo.connected && deviceInfo.qrUrl && (
                <div className="flex flex-col items-center gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-200 mt-4 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                    Scan QR Code Gateway
                  </span>
                  <img 
                    src={deviceInfo.qrUrl} 
                    alt="WhatsApp QR Code" 
                    className="w-[180px] h-[180px] bg-white border border-slate-200 rounded-xl p-2 shadow-inner" 
                  />
                  <p className="text-[9px] text-amber-700 font-bold text-center leading-normal max-w-[200px]">
                    Buka WhatsApp di HP &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-2 w-full">
            <button
              type="button"
              onClick={() => checkLiveConnection()}
              disabled={deviceInfo.checking || isRestarting}
              className="flex-1 py-2.5 px-4 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${deviceInfo.checking ? "animate-spin" : ""}`}>
                sync
              </span>
              {deviceInfo.checking ? "Memeriksa..." : "Cek Koneksi Live"}
            </button>

            {waConfig.provider === "self-hosted" && canManage && (
              <button
                type="button"
                onClick={handleLogoutGateway}
                disabled={deviceInfo.checking || isRestarting}
                className="flex-1 py-2.5 px-4 text-center text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200/60 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Mengeluarkan sesi WA di server dan meminta barcode baru"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRestarting ? "animate-spin" : ""}`}>
                  logout
                </span>
                {isRestarting ? "Memproses..." : "Tautkan Ulang / Keluar"}
              </button>
            )}
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
              {/* Dropdown Select Provider */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Penyedia WhatsApp Gateway (Provider)
                </label>
                <select
                  disabled={!canManage}
                  value={waConfig.provider || "fonnte"}
                  onChange={(e) => setWaConfig({ ...waConfig, provider: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors bg-white font-bold"
                >
                  <option value="fonnte">Fonnte Gateway (Unofficial / Local Partner)</option>
                  <option value="self-hosted">Self-Hosted Gateway (whatsapp-web.js Lokal/Cloud)</option>
                  <option value="meta">Official Meta WhatsApp Business Cloud API (Free 1000/bln)</option>
                </select>
              </div>

              {/* Fonnte Fields */}
              {(waConfig.provider === "fonnte" || !waConfig.provider) && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Fonnte URL Endpoint
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
                        Fonnte API Token
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
                </>
              )}

              {/* Self-Hosted Fields */}
              {waConfig.provider === "self-hosted" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Gateway Server URL Endpoint
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!canManage}
                      value={waConfig.endpoint}
                      onChange={(e) => setWaConfig({ ...waConfig, endpoint: e.target.value })}
                      placeholder="http://localhost:5000/send atau URL Render Anda"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 font-mono focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Secret Token Pengaman (API Token)
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        disabled={!canManage}
                        value={waConfig.token}
                        onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                        placeholder="Contoh: cirengit-super-secret-wa-token-123"
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
                </>
              )}

              {/* Meta Cloud API Fields */}
              {waConfig.provider === "meta" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Meta Phone Number ID
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!canManage}
                        value={waConfig.metaPhoneId || ""}
                        onChange={(e) => setWaConfig({ ...waConfig, metaPhoneId: e.target.value })}
                        placeholder="Contoh: 1029384756102"
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 font-mono focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Meta Access Token (Permanent / Temporary)
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? "text" : "password"}
                          required
                          disabled={!canManage}
                          value={waConfig.metaToken || ""}
                          onChange={(e) => setWaConfig({ ...waConfig, metaToken: e.target.value })}
                          placeholder="EAAW..."
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

                  <div className="border-t border-slate-100 my-2 pt-2">
                    <p className="text-[11px] font-bold text-[#F7A440] uppercase tracking-wider mb-2">Konfigurasi Template Pesan (Meta)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400">Template Akun Baru</span>
                        <input
                          type="text"
                          required
                          disabled={!canManage}
                          value={waConfig.metaTemplateWelcome || "welcome_simpa"}
                          onChange={(e) => setWaConfig({ ...waConfig, metaTemplateWelcome: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-body-md text-xs text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400">Template Kajian</span>
                        <input
                          type="text"
                          required
                          disabled={!canManage}
                          value={waConfig.metaTemplateKajian || "event_kajian"}
                          onChange={(e) => setWaConfig({ ...waConfig, metaTemplateKajian: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-body-md text-xs text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400">Template Umum</span>
                        <input
                          type="text"
                          required
                          disabled={!canManage}
                          value={waConfig.metaTemplateUmum || "event_umum"}
                          onChange={(e) => setWaConfig({ ...waConfig, metaTemplateUmum: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-body-md text-xs text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
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
              disabled={!canManage}
              placeholder={canManage ? "Contoh: 0812XXXXXXXX" : "Akses terbatas (hanya lihat)"}
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className={`w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors ${
                !canManage ? "bg-slate-50 cursor-not-allowed text-slate-400" : ""
              }`}
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
              disabled={testSent || !canManage}
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

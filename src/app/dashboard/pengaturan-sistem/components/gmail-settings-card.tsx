"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  EmailTemplateConfig,
  DEFAULT_EMAIL_TEMPLATES,
  getEmailTemplates,
  saveEmailTemplates
} from "@/common/lib/mock-db"
import { customConfirm, showToast } from "@/common/lib/alert"

interface GmailSettingsCardProps {
  canManage: boolean
}

interface SmtpInfo {
  isConfigured: boolean
  smtpUser: string
  fullSender: string
  smtpHost: string
}

export function GmailSettingsCard({ canManage }: GmailSettingsCardProps) {
  const [templates, setTemplates] = useState<EmailTemplateConfig>(DEFAULT_EMAIL_TEMPLATES)
  const [activeTab, setActiveTab] = useState<"kajian" | "umum">("kajian")
  const [isSaved, setIsSaved] = useState(false)
  const [smtpInfo, setSmtpInfo] = useState<SmtpInfo | null>(null)
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(true)

  // Test Email state
  const [testEmail, setTestEmail] = useState("")
  const [isSendingTest, setIsSendingTest] = useState(false)

  useEffect(() => {
    // Load local/synced templates
    const saved = getEmailTemplates()
    if (saved) {
      setTemplates(saved)
    }

    // Check SMTP status
    fetch("/api/test-email")
      .then((res) => res.json())
      .then((json) => {
        if (json.status && json.data) {
          setSmtpInfo(json.data)
        }
      })
      .catch((err) => {
        console.error("Gagal memeriksa status SMTP:", err)
      })
      .finally(() => {
        setIsLoadingSmtp(false)
      })
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return

    saveEmailTemplates(templates)
    setIsSaved(true)
    showToast({
      message: "Template pesan Gmail berhasil disimpan!",
      type: "success"
    })
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleReset = async () => {
    if (!canManage) return
    const confirmed = await customConfirm({
      title: "Reset Template Email",
      message: "Apakah Anda yakin ingin mengembalikan template email kajian & kegiatan umum ke format bawaan (default)?",
      type: "warning",
      confirmText: "Ya, Kembalikan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    setTemplates(DEFAULT_EMAIL_TEMPLATES)
    saveEmailTemplates(DEFAULT_EMAIL_TEMPLATES)
    showToast({
      message: "Template email berhasil dikembalikan ke default",
      type: "info"
    })
  }

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail || !testEmail.includes("@")) {
      showToast({ message: "Masukkan alamat email penerima yang valid", type: "error" })
      return
    }

    setIsSendingTest(true)
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testEmail.trim() })
      })
      const data = await res.json()

      if (data.status) {
        showToast({
          message: data.message || "Email uji coba berhasil dikirim!",
          type: "success"
        })
      } else {
        showToast({
          message: data.reason || "Gagal mengirim email uji coba",
          type: "error"
        })
      }
    } catch (err: any) {
      showToast({
        message: err.message || "Terjadi kesalahan jaringan",
        type: "error"
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const insertPlaceholder = (tag: string) => {
    if (!canManage) return
    if (activeTab === "kajian") {
      setTemplates((prev) => ({
        ...prev,
        bodyKajian: prev.bodyKajian + ` ${tag}`
      }))
    } else {
      setTemplates((prev) => ({
        ...prev,
        bodyUmum: prev.bodyUmum + ` ${tag}`
      }))
    }
  }

  const placeholdersKajian = [
    { tag: "{{NAMA}}", desc: "Nama Anggota" },
    { tag: "{{KEGIATAN}}", desc: "Judul Acara" },
    { tag: "{{TEMA}}", desc: "Tema Kajian" },
    { tag: "{{PEMATERI}}", desc: "Pemateri" },
    { tag: "{{TANGGAL}}", desc: "Hari & Tgl" },
    { tag: "{{JAM}}", desc: "Waktu/Jam" },
    { tag: "{{LOKASI}}", desc: "Tempat" }
  ]

  const placeholdersUmum = [
    { tag: "{{NAMA}}", desc: "Nama Anggota" },
    { tag: "{{KEGIATAN}}", desc: "Nama Kegiatan" },
    { tag: "{{TANGGAL}}", desc: "Hari & Tgl" },
    { tag: "{{JAM}}", desc: "Waktu/Jam" },
    { tag: "{{LOKASI}}", desc: "Tempat" }
  ]

  const currentPlaceholders = activeTab === "kajian" ? placeholdersKajian : placeholdersUmum

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5">
        <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F7A440]">mail</span>
          Pengaturan Notifikasi & Pesan Gmail
        </h3>
        {isSaved && (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-fadeIn">
            Template Disimpan!
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
        Kelola integrasi pengiriman notifikasi pengingat kegiatan melalui akun Google Workspace / Gmail resmi menggunakan protokol SMTP Nodemailer.
      </p>

      {/* SMTP Connection & Test Sender Box */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Status info */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Status SMTP Server:</span>
              {isLoadingSmtp ? (
                <span className="text-[11px] text-slate-400">Memeriksa...</span>
              ) : smtpInfo?.isConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Aktif & Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Kredensial Belum Terpasang
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {smtpInfo?.fullSender ? (
                <>Akun Pengirim: <strong className="text-slate-700">{smtpInfo.fullSender}</strong></>
              ) : (
                <span className="text-amber-600 font-sans">Setel SMTP_USER & SMTP_PASS pada file .env</span>
              )}
            </div>
          </div>

          {/* Test Sender Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                </span>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Ketik email untuk uji coba..."
                  disabled={!canManage || isSendingTest}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#F7A440] bg-white transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!canManage || isSendingTest || !testEmail}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold rounded-lg text-xs transition duration-200 shadow-sm shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingTest ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>Kirim Test</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab("kajian")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "kajian"
              ? "border-[#F7A440] text-[#F7A440]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          Template Pengingat Kajian
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("umum")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "umum"
              ? "border-[#F7A440] text-[#F7A440]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">event</span>
          Template Kegiatan Umum
        </button>
      </div>

      {/* Form Template */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Subjek */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Subjek Email</span>
            <span className="text-[10px] font-normal text-slate-400">Dapat menggunakan tag placeholder</span>
          </label>
          <input
            type="text"
            required
            disabled={!canManage}
            value={activeTab === "kajian" ? templates.subjectKajian : templates.subjectUmum}
            onChange={(e) => {
              const val = e.target.value
              setTemplates((prev) =>
                activeTab === "kajian" ? { ...prev, subjectKajian: val } : { ...prev, subjectUmum: val }
              )
            }}
            placeholder="Contoh: [SIMPA] Pengingat Kegiatan: {{KEGIATAN}}"
            className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors"
          />
        </div>

        {/* Tag Placeholders */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Placeholder Tersedia (Klik untuk menambahkan ke pesan):
          </label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {currentPlaceholders.map((item) => (
              <button
                key={item.tag}
                type="button"
                disabled={!canManage}
                onClick={() => insertPlaceholder(item.tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#b46b14] border border-amber-200/70 rounded-md text-[11px] font-mono font-bold transition-colors disabled:opacity-50"
                title={`Sisipkan ${item.desc}`}
              >
                <span>{item.tag}</span>
                <span className="text-[10px] text-amber-600 font-sans font-normal">({item.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pesan */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Isi Pesan Email
          </label>
          <textarea
            required
            rows={9}
            disabled={!canManage}
            value={activeTab === "kajian" ? templates.bodyKajian : templates.bodyUmum}
            onChange={(e) => {
              const val = e.target.value
              setTemplates((prev) =>
                activeTab === "kajian" ? { ...prev, bodyKajian: val } : { ...prev, bodyUmum: val }
              )
            }}
            placeholder="Ketik isi template pesan di sini..."
            className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 transition-colors font-mono leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={!canManage}
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset ke Default
          </button>

          {canManage && (
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#d6852a] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Simpan Template Email
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

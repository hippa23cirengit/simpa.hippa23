"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getCurrentRole,
  getStoredAcl,
  getRegistrationPrefix,
  saveRegistrationPrefix,
  getKopSuratConfig,
  saveKopSuratConfig,
  KopSuratConfig
} from "@/common/lib/mock-db"
import { customAlert, customConfirm, showToast } from "@/common/lib/alert"

export default function PengaturanPage() {
  const [currentRole, setCurrentRole] = useState("Super Admin")
  const [regPrefix, setRegPrefixInput] = useState("REG")
  const [isPrefixSaved, setIsPrefixSaved] = useState(false)

  // Kop Surat State
  const [kopSurat, setKopSurat] = useState<KopSuratConfig>({
    logoKiriUrl: "",
    logoKananUrl: "",
    namaOrganisasi: "",
    namaInstansi: "",
    alamat: ""
  })
  const [isKopSaved, setIsKopSaved] = useState(false)
  const [isUploadingKiri, setIsUploadingKiri] = useState(false)
  const [isUploadingKanan, setIsUploadingKanan] = useState(false)

  const loadData = () => {
    const role = getCurrentRole()
    setCurrentRole(role)

    const savedKopSurat = getKopSuratConfig()
    if (savedKopSurat) {
      setKopSurat(savedKopSurat)
    }

    setRegPrefixInput(getRegistrationPrefix())
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

  // Authorization check via ACL managePengaturanSistem or viewPengaturanSistem
  const activeAcl = getStoredAcl().find((r) => r.role === currentRole)
  const hasAccess = currentRole === "Super Admin" || !!activeAcl?.permissions.viewPengaturanSistem
  const canManage = currentRole === "Super Admin" || !!activeAcl?.permissions.managePengaturanSistem

  const handleSavePrefix = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    const prefixClean = regPrefix.trim().toUpperCase().replace(/[^A-Z0-9_-]/gi, "")
    if (!prefixClean) {
      showToast({
        message: "Prefix tidak valid!",
        type: "error"
      })
      return
    }

    const confirmed = await customConfirm({
      title: "Simpan Prefix Pendaftaran",
      message: `Apakah Anda yakin ingin memperbarui prefix nomor pendaftaran menjadi "${prefixClean}"?`,
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    saveRegistrationPrefix(prefixClean)
    setRegPrefixInput(prefixClean)
    setIsPrefixSaved(true)
    showToast({
      message: "Prefix pendaftaran berhasil disimpan!",
      type: "success"
    })
    setTimeout(() => {
      setIsPrefixSaved(false)
    }, 3000)
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, position: "kiri" | "kanan") => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to images, ~2MB
    if (!file.type.startsWith("image/")) {
      showToast({ message: "File harus berupa gambar (PNG/JPG)", type: "error" })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ message: "Ukuran gambar maksimal 2MB", type: "error" })
      return
    }

    if (position === "kiri") setIsUploadingKiri(true)
    else setIsUploadingKanan(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("assetId", `logo_${position}`)

      const res = await fetch("/api/upload-asset", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (res.ok && data.url) {
        setKopSurat(prev => ({
          ...prev,
          [position === "kiri" ? "logoKiriUrl" : "logoKananUrl"]: data.url
        }))
        showToast({ message: `Logo ${position} berhasil diunggah!`, type: "success" })
      } else {
        throw new Error(data.error || "Gagal mengunggah logo")
      }
    } catch (err: any) {
      console.error(err)
      showToast({ message: err.message, type: "error" })
    } finally {
      if (position === "kiri") setIsUploadingKiri(false)
      else setIsUploadingKanan(false)
    }
  }

  const handleRemoveLogo = (position: "kiri" | "kanan") => {
    setKopSurat(prev => ({
      ...prev,
      [position === "kiri" ? "logoKiriUrl" : "logoKananUrl"]: ""
    }))
  }

  const handleSaveKopSurat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    saveKopSuratConfig(kopSurat)
    setIsKopSaved(true)
    showToast({ message: "Konfigurasi Kop Surat berhasil disimpan", type: "success" })
    setTimeout(() => setIsKopSaved(false), 3000)
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

      {/* Pengaturan Pendaftaran Calon Anggota */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F7A440]">id_card</span>
            Pengaturan Pendaftaran Calon Anggota
          </h3>
          {isPrefixSaved && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-fadeIn">
              Prefix Disimpan!
            </span>
          )}
        </div>
        <form onSubmit={handleSavePrefix} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Prefix Nomor Pendaftaran (ID)
            </label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={regPrefix}
              onChange={(e) => setRegPrefixInput(e.target.value)}
              placeholder="Contoh: REG"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors font-mono"
            />
            <p className="text-[10px] text-slate-400 font-medium">Prefix ini akan digunakan untuk meng-generate nomor pendaftaran otomatis (misal: {regPrefix.trim()}-2026-001).</p>
          </div>
          {canManage && (
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2C2C2C] active:bg-[#000] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm shrink-0"
            >
              Simpan Prefix
            </button>
          )}
        </form>
      </div>



      {/* Kop Surat & PDF Laporan Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5">
          <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F7A440]">picture_as_pdf</span>
            Kop Surat & Laporan PDF
          </h3>
          {isKopSaved && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Disimpan!
            </span>
          )}
        </div>
        
        <form onSubmit={handleSaveKopSurat} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logo Kiri (PNG - Transparan)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => handleUploadLogo(e, "kiri")}
                className="hidden"
                id="upload-logo-kiri"
                disabled={!canManage || isUploadingKiri}
              />
              {kopSurat.logoKiriUrl ? (
                <div className="relative w-full h-32 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <img src={kopSurat.logoKiriUrl} alt="Logo Kiri" className="w-full h-full object-contain p-2" />
                  {canManage && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label htmlFor="upload-logo-kiri" className="cursor-pointer bg-white text-slate-800 p-2 rounded-full hover:bg-slate-100 transition shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </label>
                      <button type="button" onClick={() => handleRemoveLogo("kiri")} className="cursor-pointer bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="upload-logo-kiri"
                  className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${
                    isUploadingKiri ? "border-slate-300 bg-slate-100" : "border-[#F7A440]/40 bg-[#F7A440]/5 hover:bg-[#F7A440]/10 cursor-pointer"
                  } ${!canManage && "opacity-50 pointer-events-none"}`}
                >
                  {isUploadingKiri ? (
                    <span className="material-symbols-outlined text-3xl text-slate-400 animate-spin">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-3xl text-[#F7A440] mb-2">add_photo_alternate</span>
                      <span className="text-xs font-semibold text-slate-600">Klik untuk upload Logo Kiri</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-0.5">Format PNG (Disarankan Transparan)</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logo Kanan (Opsional - PNG)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => handleUploadLogo(e, "kanan")}
                className="hidden"
                id="upload-logo-kanan"
                disabled={!canManage || isUploadingKanan}
              />
              {kopSurat.logoKananUrl ? (
                <div className="relative w-full h-32 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <img src={kopSurat.logoKananUrl} alt="Logo Kanan" className="w-full h-full object-contain p-2" />
                  {canManage && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label htmlFor="upload-logo-kanan" className="cursor-pointer bg-white text-slate-800 p-2 rounded-full hover:bg-slate-100 transition shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </label>
                      <button type="button" onClick={() => handleRemoveLogo("kanan")} className="cursor-pointer bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="upload-logo-kanan"
                  className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${
                    isUploadingKanan ? "border-slate-300 bg-slate-100" : "border-[#F7A440]/40 bg-[#F7A440]/5 hover:bg-[#F7A440]/10 cursor-pointer"
                  } ${!canManage && "opacity-50 pointer-events-none"}`}
                >
                  {isUploadingKanan ? (
                    <span className="material-symbols-outlined text-3xl text-slate-400 animate-spin">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-3xl text-[#F7A440] mb-2">add_photo_alternate</span>
                      <span className="text-xs font-semibold text-slate-600">Klik untuk upload Logo Kanan</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-0.5">Format PNG (Disarankan Transparan)</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Organisasi (Baris 1)</label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={kopSurat.namaOrganisasi}
              onChange={(e) => setKopSurat({ ...kopSurat, namaOrganisasi: e.target.value })}
              placeholder="Contoh: HIMPUNAN PELAJAR PERSATUAN ISLAM PUTRA (HIPPA)"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Instansi / Pimpinan (Baris 2)</label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={kopSurat.namaInstansi}
              onChange={(e) => setKopSurat({ ...kopSurat, namaInstansi: e.target.value })}
              placeholder="Contoh: PIMPINAN JAMAAH CIRENGIT"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={kopSurat.alamat}
              onChange={(e) => setKopSurat({ ...kopSurat, alamat: e.target.value })}
              placeholder="Contoh: Cirengit, Ds. Cangkuang, Kec. Cangkuang, Kab. Bandung"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={!canManage}
              className="px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#d6852a] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Simpan Kop Surat
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

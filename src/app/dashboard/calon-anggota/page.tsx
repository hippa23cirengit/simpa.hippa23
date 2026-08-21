"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  getStoredMembers,
  saveStoredMembers,
  getCurrentRole,
  Member,
  getStoredAcl,
  createMemberAccount,
  getStoredApplicants,
  saveStoredApplicants,
  Applicant,
  generateNextNpa
} from "@/common/lib/mock-db"
import { customAlert, customConfirm, showToast } from "@/common/lib/alert"

const APPLICANTS_KEY = "simpa_calon_anggota"
const DEFAULT_APPLICANTS: Applicant[] = []

export default function CalonAnggota() {
  const [currentRole, setCurrentRole] = useState("Super Admin")
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null)
  
  // Add Applicant Form Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formContact, setFormContact] = useState("")
  const [formTempatLahir, setFormTempatLahir] = useState("")
  const [formTanggalLahir, setFormTanggalLahir] = useState("")
  const [formAlamat, setFormAlamat] = useState("")
  const [formPekerjaan, setFormPekerjaan] = useState("")

  const loadData = () => {
    setCurrentRole(getCurrentRole())
    setApplicants(getStoredApplicants())
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

  const saveApplicantsState = (newApps: Applicant[]) => {
    setApplicants(newApps)
    saveStoredApplicants(newApps)
  }

  const activeAcl = getStoredAcl().find(r => r.role === currentRole)
  const isReadOnly = !activeAcl?.permissions.manageCalonAnggota

  // Calculate statistics based on state
  const totalCount = applicants.length
  const waitingCount = applicants.filter(a => a.status === "Menunggu").length
  const processCount = applicants.filter(a => a.status === "Proses").length
  const acceptedCount = applicants.filter(a => a.status === "Diterima").length

  const stats = [
    { name: "Total Pendaftar", value: totalCount, icon: "group", bg: "bg-amber-500/10 text-[#F7A440]" },
    { name: "Menunggu Verifikasi", value: waitingCount, icon: "pending_actions", bg: "bg-red-500/10 text-red-600" },
    { name: "Dalam Proses", value: processCount, icon: "sync", bg: "bg-blue-500/10 text-blue-600" },
    { name: "Diterima", value: acceptedCount, icon: "check_circle", bg: "bg-emerald-500/10 text-emerald-600" }
  ]

  // Filter based on search query
  const filteredApplicants = applicants.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    if (status === "Menunggu") return "bg-red-50 text-red-700 border border-red-100"
    if (status === "Proses") return "bg-blue-50 text-blue-700 border border-blue-100"
    if (status === "Diterima") return "bg-emerald-50 text-emerald-700 border border-emerald-100"
    return "bg-slate-50 text-slate-500 border border-slate-100" // Ditolak
  }

  // Open Detail Modal
  const handleOpenDetail = (app: Applicant) => {
    setSelectedApp(app)
    setIsModalOpen(true)
  }

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormName("")
    setFormContact("")
    setFormTempatLahir("")
    setFormTanggalLahir("")
    setFormAlamat("")
    setFormPekerjaan("")
    setIsAddModalOpen(true)
  }

  // Add Candidate handler
  const handleAddApplicant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formContact.trim()) return

    const seq = String(applicants.length + 1).padStart(3, "0")
    const newApp: Applicant = {
      id: `REG-2026-${seq}`,
      name: formName,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      contact: formContact,
      status: "Menunggu",
      tempatLahir: formTempatLahir,
      tanggalLahir: formTanggalLahir,
      alamat: formAlamat,
      pekerjaan: formPekerjaan
    }

    saveApplicantsState([...applicants, newApp])
    setIsAddModalOpen(false)
    showToast({
      message: `Calon anggota "${formName}" berhasil ditambahkan!`,
      type: "success"
    })
  }

  // Accept Candidate -> Promote to Member
  const handleAccept = async (app: Applicant) => {
    // 1. Promote to Member
    const rawMembers = getStoredMembers()
    const newId = generateNextNpa(rawMembers)

    const newMember: Member = {
      id: newId,
      name: app.name,
      role: "-",
      status: "Aktif",
      tempatLahir: app.tempatLahir,
      tanggalLahir: app.tanggalLahir,
      alamat: app.alamat,
      pekerjaan: app.pekerjaan,
      whatsapp: app.contact,
      email: `${app.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      bergabungTahun: String(new Date().getFullYear()),
      createdAt: new Date().toISOString()
    }

    saveStoredMembers([...rawMembers, newMember])

    // Load admin WA for fallback notification target
    let adminWa = ""
    const session = localStorage.getItem("simpa_session")
    if (session) {
      try {
        const user = JSON.parse(session)
        if (user && user.npa) {
          const matched = rawMembers.find(m => m.id === user.npa)
          if (matched && matched.whatsapp) {
            adminWa = matched.whatsapp
          }
        }
      } catch (e) {}
    }

    createMemberAccount(newMember, adminWa)

    // 2. Remove applicant from CAANG
    const updated = applicants.filter(a => a.id !== app.id)
    saveApplicantsState(updated)

    setIsModalOpen(false)
    showToast({
      message: `Berhasil menyetujui "${app.name}" sebagai anggota!`,
      type: "success"
    })
    await customAlert({
      type: "success",
      title: "Anggota Diterima",
      message: `Calon Anggota "${app.name}" berhasil diterima sebagai anggota resmi dengan NPA: ${newId}`
    })
  }

  // Reject Candidate
  const handleReject = async (app: Applicant) => {
    const confirmed = await customConfirm({
      type: "warning",
      title: "Tolak Pendaftaran",
      message: `Apakah Anda yakin ingin menolak pendaftaran "${app.name}"?`
    })

    if (confirmed) {
      const updated = applicants.filter(a => a.id !== app.id)
      saveApplicantsState(updated)
      setIsModalOpen(false)
      showToast({
        message: `Pendaftaran "${app.name}" ditolak.`,
        type: "error"
      })
    }
  }

  // Move candidate to Proses
  const handleProcess = (app: Applicant) => {
    const updated = applicants.map(a => {
      if (a.id === app.id) {
        return { ...a, status: "Proses" as const }
      }
      return a
    })
    saveApplicantsState(updated)
    setIsModalOpen(false)
    showToast({
      message: `Pendaftaran "${app.name}" dipindah ke dalam proses.`,
      type: "info"
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Manajemen Calon Anggota</h2>
          <p className="font-body-md text-sm text-slate-500 mt-1">Kelola data pendaftaran dan status verifikasi calon anggota baru.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition duration-300 shadow-sm self-start sm:self-auto text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Calon Anggota
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg}`}>
              <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{stat.name}</p>
              <p className="font-headline-md text-lg font-bold text-slate-800 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <h3 className="font-title-lg text-base font-bold text-slate-900">Daftar Pendaftar</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg font-body-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] focus:ring-2 focus:ring-[#f7a440]/10 transition-all bg-transparent"
                placeholder="Cari nama atau no pendaftaran..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                <th className="py-3 px-4 font-label-md text-xs text-slate-500 w-12 text-center pl-6">No</th>
                <th className="py-3 px-4 font-label-md text-xs text-slate-500">Nama Lengkap</th>
                <th className="py-3 px-4 font-label-md text-xs text-slate-500">No Pendaftaran</th>
                <th className="py-3 px-4 font-label-md text-xs text-slate-500">Tanggal Daftar</th>
                <th className="py-3 px-4 font-label-md text-xs text-slate-500">Kontak</th>
                <th className="py-3 px-4 font-label-md text-xs text-slate-500">Status</th>
                <th className="py-3 px-4 font-label-md text-xs text-slate-500 text-right pr-6 w-44">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {filteredApplicants.map((app, idx) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4 text-center text-slate-400 pl-6">{idx + 1}</td>
                  <td className="py-4 px-4 font-bold">{app.name}</td>
                  <td className="py-4 px-4 text-slate-500 font-semibold">{app.id}</td>
                  <td className="py-4 px-4 text-slate-500">{app.date}</td>
                  <td className="py-4 px-4 text-slate-500">{app.contact}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right pr-6">
                    <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isReadOnly && app.status !== "Diterima" && app.status !== "Ditolak" && (
                        <button
                          onClick={() => handleOpenDetail(app)}
                          className="text-[#895200] hover:bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-200 hover:border-amber-400 transition-all"
                        >
                          Verifikasi
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenDetail(app)}
                        className="text-slate-500 hover:bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 hover:border-slate-300 transition-all"
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Review Calon Anggota */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-title-lg text-base font-bold text-slate-800">
                Detail Berkas Registrasi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-semibold text-slate-600">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-[#F7A440]/10 text-[#F7A440] flex items-center justify-center font-bold text-sm">
                  {selectedApp.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 leading-snug">{selectedApp.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">No Pendaftaran: {selectedApp.id}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 pt-2">
                <div className="border-b border-slate-50 pb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Status Registrasi</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${getStatusColor(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>
                <div className="border-b border-slate-50 pb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Tanggal Masuk Berkas</p>
                  <p className="text-slate-800 mt-1">{selectedApp.date}</p>
                </div>
                <div className="border-b border-slate-50 pb-2 col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Tempat, Tanggal Lahir</p>
                  <p className="text-slate-800 mt-1">{selectedApp.tempatLahir || "-"}, {selectedApp.tanggalLahir || "-"}</p>
                </div>
                <div className="border-b border-slate-50 pb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Nomor Telepon / WA</p>
                  <p className="text-slate-800 mt-1">{selectedApp.contact}</p>
                </div>
                <div className="border-b border-slate-50 pb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pekerjaan</p>
                  <p className="text-slate-800 mt-1">{selectedApp.pekerjaan || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Alamat Lengkap Domisili</p>
                  <p className="text-slate-800 mt-1 leading-relaxed">{selectedApp.alamat || "-"}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3">
              <div>
                {!isReadOnly && selectedApp.status === "Menunggu" && (
                  <button
                    onClick={() => handleProcess(selectedApp)}
                    className="px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50 font-bold rounded-lg text-xs transition duration-200"
                  >
                    Proses Verifikasi
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition duration-200"
                >
                  Tutup
                </button>
                
                {/* Accept / Reject actions only available if not read-only and not accepted/rejected yet */}
                {!isReadOnly && selectedApp.status !== "Diterima" && selectedApp.status !== "Ditolak" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApp)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition duration-200"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(selectedApp)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition duration-200 shadow-sm"
                    >
                      Terima Pendaftaran
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Applicant */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-title-lg text-base font-bold text-slate-800">
                Pendaftaran Calon Anggota Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddApplicant}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                  />
                </div>

                {/* Kontak */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No Telepon / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                  />
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formTempatLahir}
                      onChange={(e) => setFormTempatLahir(e.target.value)}
                      placeholder="Contoh: Bandung"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formTanggalLahir}
                      onChange={(e) => setFormTanggalLahir(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    value={formAlamat}
                    onChange={(e) => setFormAlamat(e.target.value)}
                    placeholder="Masukkan alamat lengkap pendaftar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors resize-none"
                  />
                </div>

                {/* Pekerjaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    value={formPekerjaan}
                    onChange={(e) => setFormPekerjaan(e.target.value)}
                    placeholder="Contoh: Pelajar, Mahasiswa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold rounded-lg text-xs transition duration-200 shadow-sm"
                >
                  Daftarkan Calon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

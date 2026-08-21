"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getStoredMembers, saveStoredMembers, getStoredTasykil, syncRoles, Member, getCurrentRole, getStoredAcl } from "@/common/lib/mock-db"
import { customAlert, customConfirm, showToast } from "@/common/lib/alert"

export default function DataAnggota() {
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentRole, setCurrentRole] = useState("Super Admin")

  const loadData = () => {
    const rawMembers = getStoredMembers()
    const rawTasykil = getStoredTasykil()
    const synced = syncRoles(rawMembers, rawTasykil)
    setMembers(synced)
    setCurrentRole(getCurrentRole())
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

  const activeAcl = getStoredAcl().find(r => r.role === currentRole)
  const isReadOnly = !activeAcl?.permissions.manageDataAnggota

  // Sort members A-Z by name
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name))

  // Filter based on search query
  const filteredMembers = sortedMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeClass = (role: string) => {
    if (role === "Ketua") return "bg-amber-500/10 text-amber-700 border border-amber-200"
    if (role === "Wakil Ketua") return "bg-orange-500/10 text-orange-700 border border-orange-200"
    if (role === "Sekretaris" || role === "Wakil Sekretaris") return "bg-blue-500/10 text-blue-700 border border-blue-200"
    if (role === "Bendahara" || role === "Wakil Bendahara") return "bg-emerald-500/10 text-emerald-700 border border-emerald-200"
    if (role.startsWith("Bidang")) return "bg-purple-500/10 text-purple-700 border border-purple-200"
    return "bg-slate-100 text-slate-500 border border-slate-200"
  }

  // Delete Member
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (memberId === "26.0000") {
      await customAlert({
        type: "error",
        title: "Aksi Ditolak",
        message: "Akun Super Admin utama tidak dapat dihapus!"
      })
      return
    }

    const confirmed = await customConfirm({
      type: "warning",
      title: "Hapus Anggota Permanen",
      message: `Apakah Anda yakin ingin menghapus "${memberName}" (NPA: ${memberId}) secara permanen dari database SIMPA?`
    })

    if (confirmed) {
      const rawMembers = getStoredMembers()
      const filtered = rawMembers.filter(m => m.id !== memberId)
      saveStoredMembers(filtered)
      showToast({
        message: `Anggota "${memberName}" berhasil dihapus!`,
        type: "success"
      })
      loadData()
    }
  }

  // Export Excel CSV
  const handleExportExcel = () => {
    if (members.length === 0) return

    const headers = [
      "NPA",
      "Nama Lengkap",
      "Jabatan",
      "Status",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Alamat",
      "Pekerjaan",
      "WhatsApp",
      "Email"
    ]

    const rows = filteredMembers.map(m => [
      `"${m.id}"`,
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${m.role}"`,
      `"${m.status}"`,
      `"${(m.tempatLahir || "").replace(/"/g, '""')}"`,
      `"${m.tanggalLahir || ""}"`,
      `"${[m.alamat, m.rtRw ? `RT/RW ${m.rtRw}` : null, m.kelDesa ? `Kel. ${m.kelDesa}` : null, m.kecamatan ? `Kec. ${m.kecamatan}` : null, m.kabKota].filter(Boolean).join(", ").replace(/"/g, '""')}"`,
      `"${(m.pekerjaan || "").replace(/"/g, '""')}"`,
      `"${m.whatsapp || ""}"`,
      `"${m.email || ""}"`
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Data_Anggota_HIPPA_Cirengit_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Data Anggota</h2>
          <p className="font-body-md text-sm text-slate-500 mt-1">Kelola seluruh data anggota HIPPA dalam satu tempat.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <Link
            href="/dashboard/data-anggota/kta-massal"
            className="bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition duration-300 shadow-sm text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Cetak Massal KTA
          </Link>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition duration-300 shadow-sm text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Excel
          </button>

          {!isReadOnly && (
            <Link
              href="/dashboard/data-anggota/tambah"
              className="bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition duration-300 shadow-sm text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Anggota
            </Link>
          )}
        </div>
      </div>

      {/* Toolbar (Search & Filter) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg font-body-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] focus:ring-2 focus:ring-[#f7a440]/10 transition-all bg-transparent"
            placeholder="Cari nama, NPA..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none border border-slate-200 px-4 py-2 rounded-lg font-body-md text-xs font-bold text-slate-600 hover:bg-slate-50 transition duration-300 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="flex-1 sm:flex-none border border-slate-200 px-4 py-2 rounded-lg font-body-md text-xs font-bold text-slate-600 hover:bg-slate-50 transition duration-300 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                <th className="font-label-md text-xs text-slate-500 py-3 px-4 w-16 text-center pl-6">No</th>
                <th className="font-label-md text-xs text-slate-500 py-3 px-4 w-20">Photo</th>
                <th className="font-label-md text-xs text-slate-500 py-3 px-4">Nama Lengkap</th>
                <th className="font-label-md text-xs text-slate-500 py-3 px-4">NPA</th>
                <th className="font-label-md text-xs text-slate-500 py-3 px-4">Jabatan</th>
                <th className="font-label-md text-xs text-slate-500 py-3 px-4">Status</th>
                {!isReadOnly && <th className="font-label-md text-xs text-slate-500 py-3 px-4 text-center w-24 pr-6">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMembers.map((member, idx) => {
                const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                
                const bgColors = ["bg-blue-50 text-blue-700 border-blue-100", "bg-emerald-50 text-emerald-700 border-emerald-100", "bg-purple-50 text-purple-700 border-purple-100", "bg-[#FFF3E0] text-[#E65100] border-amber-200"]
                const charCodeSum = member.name.charCodeAt(0) + (member.name.charCodeAt(1) || 0)
                const avatarColor = bgColors[charCodeSum % bgColors.length]

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-4 text-center text-slate-400 pl-6">{idx + 1}</td>
                    <td className="py-4 px-4">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ${avatarColor}`}>
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/dashboard/data-anggota/${member.id}`} className="font-bold text-slate-800 hover:text-[#F7A440] transition-colors hover:underline">
                        {member.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-semibold">{member.id}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(member.role)}`}>
                        {member.role === "-" ? "Anggota" : member.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        member.status === "Aktif" 
                          ? "bg-[#E8F5E9] text-[#2E7D32]" 
                          : member.status === "Tidak Aktif"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="py-4 px-4 text-center pr-6">
                        <div className="flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/data-anggota/edit/${member.id}`}
                            className="text-slate-400 hover:text-[#F7A440] transition-colors p-1 flex items-center"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          {member.id !== "26.0000" && (
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Menampilkan 1-{filteredMembers.length} dari {filteredMembers.length} data</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F7A440] text-white font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

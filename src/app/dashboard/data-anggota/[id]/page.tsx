"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getStoredMembers, getStoredTasykil, syncRoles, Member } from "@/common/lib/mock-db"

export default function DetailAnggota() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [member, setMember] = useState<Member | null>(null)

  useEffect(() => {
    if (!id) return
    const rawMembers = getStoredMembers()
    const rawTasykil = getStoredTasykil()
    const synced = syncRoles(rawMembers, rawTasykil)
    const found = synced.find(m => m.id === id)
    if (found) {
      setMember(found)
    }
  }, [id])

  if (!member) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 text-center">
        <h3 className="text-lg font-bold text-slate-800">Anggota Tidak Ditemukan</h3>
        <p className="text-slate-500 text-sm mt-1">Data anggota dengan NPA {id} tidak tersedia di database.</p>
        <button
          onClick={() => router.push("/dashboard/data-anggota")}
          className="mt-4 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold py-2 px-4 rounded-lg text-xs transition"
        >
          Kembali ke Daftar Anggota
        </button>
      </div>
    )
  }

  // Get status badge colors
  const getStatusBadgeClass = (status: string) => {
    if (status === "Aktif") return "bg-emerald-500/10 text-emerald-700 border border-emerald-200"
    if (status === "Tidak Aktif") return "bg-red-500/10 text-red-700 border border-red-200"
    return "bg-amber-500/10 text-amber-700 border border-amber-200" // Alumni
  }

  const getRoleBadgeClass = (role: string) => {
    if (role === "Ketua") return "bg-amber-500/10 text-amber-700 border border-amber-200"
    if (role === "Wakil Ketua") return "bg-orange-500/10 text-orange-700 border border-orange-200"
    if (role === "Sekretaris" || role === "Wakil Sekretaris") return "bg-blue-500/10 text-blue-700 border border-blue-200"
    if (role === "Bendahara" || role === "Wakil Bendahara") return "bg-emerald-500/10 text-emerald-700 border border-emerald-200"
    if (role.startsWith("Bidang")) return "bg-purple-500/10 text-purple-700 border border-purple-200"
    return "bg-slate-100 text-slate-500 border border-slate-200"
  }

  // Generate clean initials for Avatar
  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  
  // Format WhatsApp number to standard api link
  const cleanPhone = (member.whatsapp || "").replace(/[^0-9]/g, "")
  const waLink = `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}`

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/data-anggota"
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </Link>
        <div>
          <h2 className="font-headline-lg text-xl md:text-2xl font-extrabold text-[#1A1A1A]">Detail Profil Anggota</h2>
          <p className="font-body-md text-xs text-slate-400">Kembali ke daftar manajemen data anggota.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Card Profile */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-200 flex items-center justify-center font-bold text-3xl text-[#895200] shadow-inner mb-4">
            {initials}
          </div>
          
          <h3 className="font-bold text-slate-800 text-base leading-snug">{member.name}</h3>
          <p className="text-xs text-slate-400 font-mono mt-1 font-semibold">{member.id}</p>

          <div className="flex flex-col gap-2 w-full mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Status</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeClass(member.status)}`}>
                {member.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-slate-400 font-medium">Jabatan</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getRoleBadgeClass(member.role)}`}>
                {member.role === "-" ? "Anggota" : member.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Detail Metadata */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F7A440] text-[20px]">badge</span>
            <h3 className="font-bold text-slate-800 text-sm">Informasi Lengkap Anggota</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Group 1: Data Diri */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#F7A440] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Data Diri Pribadi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium mb-1">Tempat Lahir</p>
                  <p className="font-bold text-slate-800">{member.tempatLahir}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-1">Tanggal Lahir</p>
                  <p className="font-bold text-slate-800">{member.tanggalLahir}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-1">Pekerjaan / Aktivitas</p>
                  <p className="font-bold text-slate-800">{member.pekerjaan}</p>
                </div>
              </div>
            </div>

            {/* Group 2: Alamat & Kontak */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-bold text-[#F7A440] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Alamat & Kontak Aktif
              </h4>
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium mb-1">Alamat Tinggal</p>
                  <p className="font-bold text-slate-800 leading-relaxed">{member.alamat}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">No. WhatsApp / Telepon</p>
                    <p className="font-bold text-slate-800 font-mono text-sm">{member.whatsapp}</p>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1ca34d] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 shadow-sm text-xs self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Kirim WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

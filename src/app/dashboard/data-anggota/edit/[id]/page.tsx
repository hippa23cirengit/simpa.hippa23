"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { getStoredMembers, saveStoredMembers, getCurrentRole, Member, getStoredAcl } from "@/common/lib/mock-db"

export default function EditAnggotaPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params?.id as string

  const [currentRole, setCurrentRole] = useState("Super Admin")
  const [existingMembers, setExistingMembers] = useState<Member[]>([])
  const [targetMember, setTargetMember] = useState<Member | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [npa, setNpa] = useState("")
  const [status, setStatus] = useState<"Aktif" | "Tidak Aktif" | "Alumni">("Aktif")
  const [email, setEmail] = useState("")
  const [tempatLahir, setTempatLahir] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [alamat, setAlamat] = useState("")
  const [pekerjaan, setPekerjaan] = useState("")
  const [whatsapp, setWhatsapp] = useState("")



  useEffect(() => {
    const role = getCurrentRole()
    setCurrentRole(role)
    const activeAcl = getStoredAcl().find(r => r.role === role)
    if (activeAcl && !activeAcl.permissions.manageDataAnggota) {
      router.replace(`/dashboard/data-anggota/${memberId}`)
      return
    }

    const members = getStoredMembers()
    setExistingMembers(members)
    
    const member = members.find(m => m.id === memberId)
    if (member) {
      setTargetMember(member)
      setName(member.name)
      setNpa(member.id)
      setStatus(member.status)
      setEmail(member.email || "")
      setTempatLahir(member.tempatLahir || "")
      setTanggalLahir(member.tanggalLahir || "")
      setAlamat(member.alamat || "")
      setPekerjaan(member.pekerjaan || "")
      setWhatsapp(member.whatsapp || "")
    }
  }, [memberId])



  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !npa.trim() || !email.trim()) return

    const updatedMembers = existingMembers.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          id: npa.trim().toUpperCase(), // Update ID in case NPA is renamed
          name: name.trim(),
          status,
          tempatLahir: tempatLahir.trim(),
          tanggalLahir: tanggalLahir.trim(),
          alamat: alamat.trim(),
          pekerjaan: pekerjaan.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim()
        }
      }
      return m
    })

    saveStoredMembers(updatedMembers)
    router.push("/dashboard/data-anggota")
  }

  // Auth Guard block
  if (currentRole === "Anggota") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-6">
        <div className="w-24 h-24 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[48px]">block</span>
        </div>
        <div className="space-y-2">
          <h3 className="font-headline-md text-xl font-bold text-slate-800">Akses Ditolak</h3>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Role Anda tidak memiliki izin untuk mengubah data anggota.
          </p>
        </div>
        <Link
          href="/dashboard/data-anggota"
          className="px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm"
        >
          Kembali ke Data Anggota
        </Link>
      </div>
    )
  }

  if (!targetMember) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500 font-bold">Data Anggota tidak ditemukan.</p>
        <Link href="/dashboard/data-anggota" className="text-xs text-[#F7A440] underline mt-2 block">
          Kembali ke Data Anggota
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/data-anggota"
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm animate-fadeIn"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </Link>
        <div>
          <h2 className="font-headline-lg text-2xl font-extrabold text-[#1A1A1A] leading-tight">Ubah Data Anggota</h2>
          <p className="font-body-md text-xs text-slate-500 mt-0.5">Ubah informasi lengkap untuk anggota {targetMember.name}.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
              />
            </div>

            {/* NPA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NPA (Nomor Pokok Anggota) *</label>
              <input
                type="text"
                disabled
                value={npa}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Email (Gmail) *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: nama.anggota@gmail.com"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Keanggotaan *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 bg-white focus:outline-none focus:border-[#F7A440] transition-colors"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            {/* Tempat Lahir */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tempat Lahir</label>
              <input
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Lahir</label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
              />
            </div>

            {/* Pekerjaan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pekerjaan</label>
              <input
                type="text"
                value={pekerjaan}
                onChange={(e) => setPekerjaan(e.target.value)}
                placeholder="Contoh: Karyawan Swasta, Wirausaha"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
              />
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
              />
            </div>

            {/* Alamat */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
              <textarea
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Masukkan alamat domisili lengkap"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors resize-none leading-relaxed"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/data-anggota"
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition duration-200"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25]"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

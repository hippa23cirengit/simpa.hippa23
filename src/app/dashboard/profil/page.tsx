"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSession, setSession, clearSession } from "@/common/lib/auth"
import {
  getStoredAccounts,
  saveStoredAccounts,
  getStoredMembers,
  saveStoredMembers,
  LoginAccount,
  Member,
  getCurrentRole
} from "@/common/lib/mock-db"
import { customAlert } from "@/common/lib/alert"

export default function ProfilPage() {
  const router = useRouter()
  const [account, setAccount] = useState<LoginAccount | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [currentRole, setCurrentRole] = useState("")
  const [userPhoto, setUserPhoto] = useState("")
  const [uploading, setUploading] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [alamat, setAlamat] = useState("")
  const [rtRw, setRtRw] = useState("")
  const [kelDesa, setKelDesa] = useState("")
  const [kecamatan, setKecamatan] = useState("")
  const [kabKota, setKabKota] = useState("")
  const [tempatLahir, setTempatLahir] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [pekerjaan, setPekerjaan] = useState("")

  // Password State
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification State
  const [infoMsg, setInfoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const loadProfile = () => {
    const session = getSession()
    if (!session) return

    const role = getCurrentRole()
    setCurrentRole(role)

    const accounts = getStoredAccounts()
    const acc = accounts.find((a) => a.npa === session.npa)
    if (acc) {
      setAccount(acc)
      setName(acc.name)

      if (acc.linkedAnggotaId) {
        const members = getStoredMembers()
        const mem = members.find((m) => m.id === acc.linkedAnggotaId)
        if (mem) {
          setMember(mem)
          setEmail(mem.email || "")
          setWhatsapp(mem.whatsapp || "")
          setUserPhoto(mem.profilePhoto || "/default pic.webp")
          setAlamat(mem.alamat || "")
          setRtRw(mem.rtRw || "")
          setKelDesa(mem.kelDesa || "")
          setKecamatan(mem.kecamatan || "")
          setKabKota(mem.kabKota || "")
          setTempatLahir(mem.tempatLahir || "")
          setTanggalLahir(mem.tanggalLahir || "")
          setPekerjaan(mem.pekerjaan || "")
        }
      }
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !account) return

    setUploading(true)
    setInfoMsg(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://buylslyfndjjyqhqvpyk.supabase.co"
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KgKMdTFKj6yO9gvwHdHARw_Ot_3N8Dd"
      const bucketName = "profilephoto"
      const fileExt = file.name.split(".").pop()
      const filePath = `avatar_${account.npa}_${Date.now()}.${fileExt}`

      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": file.type
        },
        body: file
      })

      const resData = await res.json()
      if (!res.ok) {
        const errMsg = resData.message || resData.error || JSON.stringify(resData)
        throw new Error(errMsg)
      }

      // Public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`

      // Save URL to mock database
      if (account.linkedAnggotaId) {
        const storedMembers = getStoredMembers()
        const updatedMembers = storedMembers.map((m) => {
          if (m.id === account.linkedAnggotaId) {
            return { ...m, profilePhoto: publicUrl }
          }
          return m
        })
        saveStoredMembers(updatedMembers)
        
        const updatedMem = updatedMembers.find((m) => m.id === account.linkedAnggotaId)
        if (updatedMem) {
          setMember(updatedMem)
          setUserPhoto(publicUrl)
        }
      }

      // Dispatch event to sync Layout & Sidebar
      window.dispatchEvent(new Event("simpa_role_changed"))
      
      await customAlert({
        type: "success",
        title: "Unggah Sukses",
        message: "Foto profil berhasil diperbarui!"
      })
      setInfoMsg({ type: "success", text: "Foto profil berhasil diperbarui!" })
      setTimeout(() => setInfoMsg(null), 3000)
    } catch (err: any) {
      console.error(err)
      await customAlert({
        type: "error",
        title: "Gagal Mengunggah",
        message: "Gagal upload: " + err.message
      })
      setInfoMsg({ type: "error", text: err.message || "Gagal memperbarui foto profil." })
    } finally {
      setUploading(false)
    }
  }

  const initials = (name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // Save personal info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault()
    setInfoMsg(null)

    if (!account) return

    // Update account
    const accounts = getStoredAccounts()
    const updatedAccounts = accounts.map((acc) => {
      if (acc.npa === account.npa) {
        return { ...acc, name }
      }
      return acc
    })
    saveStoredAccounts(updatedAccounts)

    // Update session
    const session = getSession()
    if (session) {
      setSession({
        ...session,
        name
      })
    }

    // Update member if linked
    if (account.linkedAnggotaId) {
      const members = getStoredMembers()
      const updatedMembers = members.map((m) => {
        if (m.id === account.linkedAnggotaId) {
          return {
            ...m,
            name,
            email,
            whatsapp,
            alamat,
            rtRw,
            kelDesa,
            kecamatan,
            kabKota,
            tempatLahir,
            tanggalLahir,
            pekerjaan
          }
        }
        return m
      })
      saveStoredMembers(updatedMembers)
    }

    window.dispatchEvent(new Event("simpa_role_changed"))
    setInfoMsg({ type: "success", text: "Informasi profil berhasil diperbarui!" })
    setTimeout(() => setInfoMsg(null), 3000)
  }

  // Change password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg(null)

    if (!account) return

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassMsg({ type: "error", text: "Semua kolom kata sandi wajib diisi." })
      return
    }

    if (oldPassword !== account.passwordHash) {
      setPassMsg({ type: "error", text: "Kata sandi lama yang Anda masukkan salah." })
      return
    }

    if (newPassword.length < 6) {
      setPassMsg({ type: "error", text: "Kata sandi baru minimal 6 karakter." })
      return
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." })
      return
    }

    // Update password in accounts
    const accounts = getStoredAccounts()
    const updatedAccounts = accounts.map((acc) => {
      if (acc.npa === account.npa) {
        return { ...acc, passwordHash: newPassword }
      }
      return acc
    })
    saveStoredAccounts(updatedAccounts)

    setAccount((prev) => (prev ? { ...prev, passwordHash: newPassword } : null))
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")

    setPassMsg({ type: "success", text: "Kata sandi Anda berhasil diperbarui!" })
    setTimeout(() => setPassMsg(null), 4000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">
          Profil Pengguna
        </h2>
        <p className="font-body-md text-sm text-slate-500 mt-1">
          Atur informasi akun dan keamanan kata sandi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar (Span 4) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center">
          <h3 className="font-title-lg text-sm font-bold text-slate-800 self-start mb-4">
            Foto & Identitas Akun
          </h3>
          {/* Avatar Area with upload trigger */}
          <div className="relative group w-24 h-24 mb-4 select-none cursor-pointer rounded-full overflow-hidden border-2 border-amber-200 shadow-inner bg-amber-500/10 flex items-center justify-center">
            {uploading ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Uploading</span>
              </div>
            ) : (
              <img src={userPhoto || "/default pic.webp"} alt="Profile" className="w-full h-full object-cover" />
            )}
            
            {/* Hover overlay for changing picture */}
            {!uploading && (
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-0.5 text-white transition-opacity duration-200 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span className="text-[8px] font-bold uppercase tracking-widest">Ubah Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <h4 className="font-bold text-slate-800 text-base leading-snug">{name}</h4>
          <p className="text-xs text-slate-400 font-mono mt-0.5 font-semibold">
            {account?.npa || "-"}
          </p>

          <div className="w-full mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Peran Sistem</span>
              <span className="font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">
                {currentRole}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Tipe Akun</span>
              <span className="font-bold text-slate-700">
                {account?.npa === "26.0000" ? "🖥️ Super Admin" : "👤 Anggota"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Password (Span 8) */}
        <div className="md:col-span-8 space-y-6">
          {/* Section 1: Personal Info */}
          <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F7A440]">badge</span>
                Informasi Pribadi
              </h3>
            </div>

            {infoMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  infoMsg.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {infoMsg.type === "success" ? "check_circle" : "error"}
                </span>
                <span>{infoMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  NPA / Username
                </label>
                <input
                  type="text"
                  value={account?.npa || ""}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Peran Sistem (ACL)
                </label>
                <input
                  type="text"
                  value={currentRole}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              {account?.linkedAnggotaId && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      required
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Pekerjaan / Status
                    </label>
                    <input
                      type="text"
                      required
                      value={pekerjaan}
                      onChange={(e) => setPekerjaan(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Alamat Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      RT / RW
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 03/03"
                      value={rtRw}
                      onChange={(e) => setRtRw(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Desa / Kelurahan
                    </label>
                    <input
                      type="text"
                      required
                      value={kelDesa}
                      onChange={(e) => setKelDesa(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      required
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Kabupaten / Kota
                    </label>
                    <input
                      type="text"
                      required
                      value={kabKota}
                      onChange={(e) => setKabKota(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Simpan Profil
              </button>
            </div>
          </form>

          {/* Section 2: Security / Password */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F7A440]">lock_open</span>
                Keamanan Kata Sandi
              </h3>
            </div>

            {passMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  passMsg.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {passMsg.type === "success" ? "check_circle" : "error"}
                </span>
                <span>{passMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Kata Sandi Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Konfirmasi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F7A440] transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#2C2C2C] active:bg-[#000] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                Ubah Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

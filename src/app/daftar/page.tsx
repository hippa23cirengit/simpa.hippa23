"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { registerApplicantAction } from "@/modules/calon-anggota/actions/register.action"

export default function DaftarPage() {
  const [formData, setFormData] = useState({
    name: "", 
    contact: "", 
    email: "",
    tempatLahir: "", 
    tanggalLahir: "", 
    alamat: "", 
    rtRw: "",
    kelDesa: "",
    kecamatan: "",
    kabKota: "",
    pekerjaan: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    try {
      const res = await registerApplicantAction(formData)
      if (res.success) {
        setSuccess(true)
      } else {
        setErrorMsg(res.error || "Gagal mendaftar. Silakan coba lagi.")
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-sm border border-slate-200/60">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Jazakumullah khairan. Data formulir Anda sudah masuk ke sistem kami. 
            Silakan tunggu informasi selanjutnya dari pengurus / admin HIPPA.
          </p>
          <Link href="/" className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#F7A440]/20 to-transparent -z-10"></div>
      
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Image 
            src="/logo.png" 
            alt="Logo HIPPA" 
            width={72} 
            height={72} 
            className="mx-auto mb-4 drop-shadow-md object-contain"
          />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Formulir Pendaftaran</h1>
          <p className="text-slate-600 mt-2 font-medium">Himpunan Pelajar Persatuan Islam Putra (HIPPA) Cirengit</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-10">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {errorMsg}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Contoh: budi.santoso@gmail.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">No. WhatsApp <span className="text-slate-400 font-normal text-xs ml-1">(Opsional)</span></label>
              <input 
                type="tel" 
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Contoh: 08123456789"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tempat Lahir</label>
                <input 
                  type="text" 
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleChange}
                  placeholder="Tempat lahir"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Lahir</label>
                <input 
                  type="date" 
                  name="tanggalLahir"
                  value={formData.tanggalLahir}
                  onChange={handleChange}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Pekerjaan / Status</label>
              <input 
                type="text" 
                name="pekerjaan"
                value={formData.pekerjaan}
                onChange={handleChange}
                placeholder="Pelajar / Mahasiswa / Pegawai"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <input 
                type="text" 
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Nama Jalan / Kampung"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="rtRw"
                  value={formData.rtRw}
                  onChange={handleChange}
                  placeholder="RT/RW"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
                />
                <input 
                  type="text" 
                  name="kelDesa"
                  value={formData.kelDesa}
                  onChange={handleChange}
                  placeholder="Desa/Kelurahan"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="kecamatan"
                  value={formData.kecamatan}
                  onChange={handleChange}
                  placeholder="Kecamatan"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
                />
                <input 
                  type="text" 
                  name="kabKota"
                  value={formData.kabKota}
                  onChange={handleChange}
                  placeholder="Kabupaten/Kota"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-[#F7A440] focus:ring-4 focus:ring-[#F7A440]/10 outline-none transition font-medium text-slate-800 placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#F7A440] hover:bg-[#e69433] active:bg-[#d6852a] text-white font-extrabold text-lg py-4 rounded-xl transition duration-300 shadow-md shadow-[#F7A440]/30 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  Kirim Pendaftaran
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </>
              )}
            </button>
          </div>
          
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

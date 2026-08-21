"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getStoredMembers, getStoredTasykil, syncRoles, Member, getStoredKtaSettings, saveStoredKtaSettings, KtaSettings } from "@/common/lib/mock-db"
import { showToast } from "@/common/lib/alert"
import { useDialog } from "@/common/components/dialog-provider"
import { KtaCard } from "@/components/KtaCard"

export default function CetakKtaPage() {
  const params = useParams()
  const router = useRouter()
  const { showAlert } = useDialog()
  const id = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [ktaSettings, setKtaSettings] = useState<KtaSettings>({ ketuaName: "", ketuaNpa: "", signatureUrl: "" })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    const rawMembers = getStoredMembers()
    const rawTasykil = getStoredTasykil()
    const synced = syncRoles(rawMembers, rawTasykil)
    const found = synced.find(m => m.id === id)
    if (found) {
      setMember(found)
    }
    
    // Load KTA Settings
    setKtaSettings(getStoredKtaSettings())
  }, [id])

  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://buylslyfndjjyqhqvpyk.supabase.co"
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KgKMdTFKj6yO9gvwHdHARw_Ot_3N8Dd"
      const bucketName = "profilephoto"
      const fileExt = file.name.split(".").pop()
      const filePath = `signature_${Date.now()}.${fileExt}`

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
        throw new Error(resData.message || resData.error || JSON.stringify(resData))
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
      
      const newSettings = { ...ktaSettings, signatureUrl: publicUrl }
      setKtaSettings(newSettings)
      saveStoredKtaSettings(newSettings)

      showToast({ message: "Tanda tangan berhasil diunggah!", type: "success" })
    } catch (err: any) {
      console.error(err)
      await showAlert("Gagal mengunggah tanda tangan: " + err.message, "Upload Gagal", "danger")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteSignature = () => {
    const newSettings = { ...ktaSettings, signatureUrl: "" }
    setKtaSettings(newSettings)
    saveStoredKtaSettings(newSettings)
    showToast({ message: "Tanda tangan dihapus!", type: "success" })
  }

  const handleSaveSettings = () => {
    saveStoredKtaSettings(ktaSettings)
    showToast({ message: "Pengaturan KTA berhasil disimpan!", type: "success" })
  }

  const handlePrint = () => {
    window.print()
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-bold">Memuat data KTA...</p>
      </div>
    )
  }

  // Formatting dates (assuming DD Month, YYYY)
  const formatTanggalLahir = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Hide this entire header and settings section during print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}} />

      {/* Header (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/data-anggota/${member.id}`}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </Link>
          <div>
            <h2 className="font-headline-lg text-xl md:text-2xl font-extrabold text-[#1A1A1A]">Generator E-KTA</h2>
            <p className="font-body-md text-xs text-slate-400">Pratinjau dan cetak Kartu Tanda Anggota.</p>
          </div>
        </div>
        
        <button
          onClick={handlePrint}
          className="bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition duration-200 shadow-sm text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Cetak KTA Sekarang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Panel (No Print) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 no-print h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
            <span className="material-symbols-outlined text-[#F7A440] text-[20px]">settings</span>
            <h3 className="font-bold text-slate-800">Pengaturan KTA Dinamis</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Ketua</label>
              <input
                type="text"
                value={ktaSettings.ketuaName}
                onChange={(e) => setKtaSettings({...ktaSettings, ketuaName: e.target.value})}
                placeholder="Contoh: Fulan Bin Fulan"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F7A440]"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NPA Ketua</label>
              <input
                type="text"
                value={ktaSettings.ketuaNpa}
                onChange={(e) => setKtaSettings({...ktaSettings, ketuaNpa: e.target.value})}
                placeholder="Contoh: 00.0000"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F7A440]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanda Tangan Ketua</label>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {ktaSettings.signatureUrl ? (
                  <img src={ktaSettings.signatureUrl} alt="Signature" className="h-10 max-w-[80px] object-contain border border-slate-200 rounded p-1 bg-white" />
                ) : (
                  <div className="h-10 px-3 flex items-center justify-center border border-dashed border-slate-300 rounded text-xs text-slate-400 font-medium">Belum ada</div>
                )}
                
                <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  {uploading ? "Loading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleUploadSignature}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {ktaSettings.signatureUrl && (
                  <button
                    onClick={handleDeleteSignature}
                    className="cursor-pointer bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 transition flex items-center justify-center"
                    title="Hapus Tanda Tangan"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Gunakan gambar PNG background transparan.</p>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>

        {/* Print Area Preview */}
        <div className="lg:col-span-2 flex flex-col items-center gap-6 overflow-x-auto pb-8">
          
          <div id="print-area" className="flex flex-col gap-6">
            <KtaCard member={member} ktaSettings={ktaSettings} side="front" />
            <KtaCard member={member} ktaSettings={ktaSettings} side="back" />
          </div>
        </div>

      </div>
    </div>
  )
}

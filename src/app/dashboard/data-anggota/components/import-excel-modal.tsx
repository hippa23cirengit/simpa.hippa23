import React, { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { getStoredMembers, saveStoredMembers, generateNextNpa, Member, createMemberAccount, syncDatabaseFromServer } from "@/common/lib/mock-db"
import { useDialog } from "@/common/components/dialog-provider"

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ParsedRow {
  name: string
  status: string
  email: string
  bergabungTahun?: string
  whatsapp?: string
  tempatLahir?: string
  tanggalLahir?: string
  pekerjaan?: string
  alamat?: string
  rtRw?: string
  kelDesa?: string
  kecamatan?: string
  kabKota?: string
  isValid: boolean
  errors: string[]
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const { showAlert } = useDialog()
  const [activeTab, setActiveTab] = useState<"download" | "upload">("download")
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDownloadTemplate = () => {
    const headers = [
      "Nama Lengkap", "Status", "Email", "Tahun Bergabung", 
      "No. WhatsApp", "Tempat Lahir", "Tanggal Lahir", "Pekerjaan",
      "Alamat", "RT / RW", "Kelurahan / Desa", "Kecamatan", "Kabupaten / Kota"
    ]
    
    // Sample data
    const sampleData = [
      ["Fulan bin Fulan", "Aktif", "fulan@example.com", "2023", "08123456789", "Bandung", "2000-01-01", "Karyawan", "Jl. Cirengit No 1", "01/01", "Cirengit", "Cangkuang", "Kabupaten Bandung"]
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template_Anggota")
    XLSX.writeFile(wb, "Template_Import_Anggota_HIPPA.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        const members = getStoredMembers()
        const existingEmails = members.map(m => (m.email || "").toLowerCase())

        const rows: ParsedRow[] = data.map((row, index) => {
          const errors: string[] = []
          
          const name = row["Nama Lengkap"]?.toString().trim()
          const status = row["Status"]?.toString().trim()
          const email = row["Email"]?.toString().trim().toLowerCase()
          
          if (!name) errors.push("Nama kosong")
          if (!status || !["Aktif", "Tidak Aktif", "Alumni"].includes(status)) errors.push("Status tidak valid")
          if (!email) {
            errors.push("Email kosong")
          } else if (existingEmails.includes(email) || data.findIndex(r => r["Email"]?.toString().trim().toLowerCase() === email) !== index) {
            errors.push("Email duplikat")
          }

          return {
            name: name || "",
            status: status || "Aktif",
            email: email || "",
            bergabungTahun: row["Tahun Bergabung"]?.toString().trim(),
            whatsapp: row["No. WhatsApp"]?.toString().trim(),
            tempatLahir: row["Tempat Lahir"]?.toString().trim(),
            tanggalLahir: row["Tanggal Lahir"]?.toString().trim(),
            pekerjaan: row["Pekerjaan"]?.toString().trim(),
            alamat: row["Alamat"]?.toString().trim(),
            rtRw: row["RT / RW"]?.toString().trim(),
            kelDesa: row["Kelurahan / Desa"]?.toString().trim(),
            kecamatan: row["Kecamatan"]?.toString().trim(),
            kabKota: row["Kabupaten / Kota"]?.toString().trim(),
            isValid: errors.length === 0,
            errors
          }
        })

        setParsedData(rows)
      } catch (error) {
        showAlert("Gagal membaca file Excel. Pastikan format sesuai template.", "Gagal Membaca File", "danger")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleProcessImport = async () => {
    if (parsedData.length === 0) return
    const invalidRows = parsedData.filter(r => !r.isValid)
    if (invalidRows.length > 0) {
      await showAlert("Masih ada data yang error. Harap perbaiki file Excel Anda dan upload ulang.", "Terdapat Error", "warning")
      return
    }

    setIsProcessing(true)
    try {
      const members = getStoredMembers()
      
      for (const row of parsedData) {
        const joinYear = row.bergabungTahun ? parseInt(row.bergabungTahun) : new Date().getFullYear()
        const newNpa = generateNextNpa(members, joinYear)
        
        const newMember: Member = {
          id: newNpa,
          name: row.name,
          role: "-",
          status: row.status as any,
          email: row.email,
          tempatLahir: row.tempatLahir || "",
          tanggalLahir: row.tanggalLahir || "",
          alamat: row.alamat || "",
          rtRw: row.rtRw || "",
          kelDesa: row.kelDesa || "",
          kecamatan: row.kecamatan || "",
          kabKota: row.kabKota || "",
          pekerjaan: row.pekerjaan || "",
          whatsapp: row.whatsapp || "",
          profilePhoto: undefined,
          bergabungTahun: row.bergabungTahun || new Date().getFullYear().toString(),
          createdAt: new Date().toISOString()
        }
        
        members.push(newMember)
        
        // Buat akun login
        createMemberAccount(newMember, "")
      }
      
      saveStoredMembers(members)
      
      // Karena kita ga mau commit & user mau push manual, panggil sync
      await syncDatabaseFromServer()
      
      await showAlert(`Berhasil mengimpor ${parsedData.length} anggota!`, "Sukses", "success")
      onSuccess()
      onClose()
    } catch (error: any) {
      await showAlert("Terjadi kesalahan saat menyimpan data: " + error.message, "Gagal Menyimpan", "danger")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Import Data Anggota</h2>
            <p className="text-xs text-slate-500 mt-1">Tambahkan banyak anggota sekaligus dari file Excel.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab("download")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "download" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            1. Download Template
          </button>
          <button 
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "upload" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            2. Upload & Preview
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === "download" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px]">download</span>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-800 mb-2">Gunakan Template Standar</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Unduh template Excel yang sudah kami siapkan, isi data anggota Anda sesuai format, dan biarkan sistem kami yang men-generate NPA secara otomatis.
                </p>
              </div>
              <button 
                onClick={handleDownloadTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">table_chart</span>
                Download Template Excel
              </button>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Upload File .xlsx</h3>
                  <p className="text-xs text-slate-500">Pastikan Anda menggunakan file hasil download dari tab pertama.</p>
                </div>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="block w-64 text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {parsedData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Tahun</th>
                          <th className="px-4 py-3">WhatsApp</th>
                          <th className="px-4 py-3">Alamat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? "" : "bg-red-50/50"}>
                            <td className="px-4 py-2">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span> Valid
                                </span>
                              ) : (
                                <div className="group relative inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md border border-red-200 cursor-help">
                                  <span className="material-symbols-outlined text-[12px]">error</span> Error
                                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-slate-800 text-white p-2 rounded text-xs z-10 shadow-xl">
                                    {row.errors.join(", ")}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 font-medium text-slate-800">{row.name || "-"}</td>
                            <td className="px-4 py-2 text-slate-500">{row.email || "-"}</td>
                            <td className="px-4 py-2 text-slate-500">{row.bergabungTahun || "-"}</td>
                            <td className="px-4 py-2 text-slate-500">{row.whatsapp || "-"}</td>
                            <td className="px-4 py-2 text-slate-500 truncate max-w-[150px]">{row.alamat || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === "upload" && parsedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500">
              Total Data: <span className="text-slate-800">{parsedData.length}</span> | 
              Error: <span className={parsedData.some(r => !r.isValid) ? "text-red-600" : "text-emerald-600"}>{parsedData.filter(r => !r.isValid).length}</span>
            </p>
            <button
              onClick={handleProcessImport}
              disabled={isProcessing || parsedData.some(r => !r.isValid)}
              className="bg-[#12423F] hover:bg-[#0c2e2c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold text-sm transition-all"
            >
              {isProcessing ? "Memproses..." : "Proses Import"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

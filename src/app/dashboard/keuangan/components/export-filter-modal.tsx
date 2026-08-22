import React, { useState } from "react"

export type ExportRange = "1_minggu" | "4_minggu" | "8_minggu" | "12_minggu" | "1_tahun" | "2_tahun" | "semua"

interface ExportFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (range: ExportRange) => void
  exportType: "pdf" | "excel"
}

export function ExportFilterModal({ isOpen, onClose, onExport, exportType }: ExportFilterModalProps) {
  const [selectedRange, setSelectedRange] = useState<ExportRange>("semua")

  if (!isOpen) return null

  const ranges = [
    { id: "1_minggu", label: "1 Minggu Terakhir" },
    { id: "4_minggu", label: "4 Minggu Terakhir" },
    { id: "8_minggu", label: "8 Minggu Terakhir" },
    { id: "12_minggu", label: "12 Minggu Terakhir" },
    { id: "1_tahun", label: "1 Tahun Terakhir" },
    { id: "2_tahun", label: "2 Tahun Terakhir" },
    { id: "semua", label: "Semua Waktu" },
  ]

  const handleExport = () => {
    onExport(selectedRange)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pilih Rentang Waktu</h2>
            <p className="text-xs text-slate-500 mt-1">
              Data yang akan diekspor ke {exportType.toUpperCase()} akan difilter.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-700">Rentang Waktu Filter</span>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as ExportRange)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#F7A440]/50 transition-all appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
            >
              {ranges.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl transition shadow-sm"
          >
            Batal
          </button>
          <button 
            onClick={handleExport}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#F7A440] hover:bg-[#e09132] rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">
              {exportType === "pdf" ? "picture_as_pdf" : "table_chart"}
            </span>
            Cetak {exportType.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { ScheduledEvent, syncDatabaseFromServer } from "@/common/lib/mock-db"

interface Recipient {
  id: string
  name: string
  email: string
}

interface BroadcastEmailModalProps {
  isOpen: boolean
  onClose: () => void
  event: ScheduledEvent | null
  onSuccess: () => void
}

const BATCH_SIZE = 5

export function BroadcastEmailModal({
  isOpen,
  onClose,
  event,
  onSuccess
}: BroadcastEmailModalProps) {
  const [step, setStep] = useState<"loading" | "confirm" | "sending" | "complete" | "error">("loading")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  
  // Progress tracking
  const [processedCount, setProcessedCount] = useState(0)
  const [sentSuccessCount, setSentSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [currentBatchNum, setCurrentBatchNum] = useState(1)
  const [batchErrors, setBatchErrors] = useState<any[]>([])
  
  const isAbortedRef = useRef(false)

  const totalBatches = Math.ceil(recipients.length / BATCH_SIZE) || 1

  useEffect(() => {
    if (!isOpen || !event) return

    setStep("loading")
    setRecipients([])
    setErrorMessage("")
    setProcessedCount(0)
    setSentSuccessCount(0)
    setFailedCount(0)
    setCurrentBatchNum(1)
    setBatchErrors([])
    isAbortedRef.current = false

    // Fetch eligible active members
    fetch(`/api/kegiatan/${event.id}/recipients`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status && json.data) {
          setRecipients(json.data.recipients || [])
          setStep("confirm")
        } else {
          setErrorMessage(json.reason || "Gagal memuat daftar anggota ber-email.")
          setStep("error")
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "Terjadi kesalahan jaringan.")
        setStep("error")
      })
  }, [isOpen, event])

  if (!isOpen || !event) return null

  const handleStartSending = async () => {
    if (recipients.length === 0) return

    setStep("sending")
    isAbortedRef.current = false
    let currentProcessed = 0
    let currentSent = 0
    let currentFailed = 0
    const errorsList: any[] = []

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      if (isAbortedRef.current) {
        break
      }

      const chunk = recipients.slice(i, i + BATCH_SIZE)
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1
      const isLast = i + BATCH_SIZE >= recipients.length

      setCurrentBatchNum(batchIndex)

      try {
        const response = await fetch(`/api/kegiatan/${event.id}/send-email-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: chunk,
            isLastBatch: isLast
          })
        })

        const data = await response.json()
        if (data.status && data.data) {
          currentSent += data.data.sentCount
          currentFailed += data.data.failedCount
          if (data.data.errors && data.data.errors.length > 0) {
            errorsList.push(...data.data.errors)
          }
        } else {
          currentFailed += chunk.length
          errorsList.push({ error: data.reason || "Gagal pada batch pengiriman" })
        }
      } catch (err: any) {
        currentFailed += chunk.length
        errorsList.push({ error: err.message || "Kesalahan jaringan pada batch" })
      }

      currentProcessed += chunk.length
      setProcessedCount(Math.min(currentProcessed, recipients.length))
      setSentSuccessCount(currentSent)
      setFailedCount(currentFailed)
      setBatchErrors([...errorsList])
    }

    // Done all batches
    try {
      await syncDatabaseFromServer()
    } catch (e) {
      console.error(e)
    }

    onSuccess()
    setStep("complete")
  }

  const handleAbort = () => {
    isAbortedRef.current = true
  }

  const progressPercent = recipients.length > 0
    ? Math.round((processedCount / recipients.length) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scaleIn flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F7A440]/10 text-[#F7A440] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Kirim Notifikasi Email Agenda
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[320px]">
                {event.title}
              </p>
            </div>
          </div>
          {step !== "sending" && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: LOADING */}
          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#F7A440] animate-spin">
                progress_activity
              </span>
              <p className="text-xs font-semibold text-slate-600">
                Memeriksa daftar anggota aktif ber-email...
              </p>
            </div>
          )}

          {/* STEP 2: ERROR FETCHING */}
          {step === "error" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">error</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Gagal Mempersiapkan Pengiriman</h4>
                <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === "confirm" && (
            <div className="space-y-4">
              {/* Event Summary Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Jenis Kegiatan:</span>
                  <span className="font-bold text-slate-700 uppercase">{event.type || "Umum"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Waktu & Tanggal:</span>
                  <span className="font-semibold text-slate-700">{event.date} • {event.time} WIB</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Lokasi:</span>
                  <span className="font-semibold text-slate-700">{event.location}</span>
                </div>
              </div>

              {/* Recipients Box */}
              {recipients.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center space-y-1">
                  <p className="font-bold">Tidak ada anggota yang memenuhi syarat</p>
                  <p className="text-[11px] text-amber-700">
                    Pastikan status anggota adalah <strong>Aktif</strong> dan kolom email sudah terisi dengan alamat email yang valid di menu Data Anggota.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-blue-600">group</span>
                      Penerima Siap:
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white font-bold rounded-full text-xs">
                      {recipients.length} Anggota
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700/90 leading-relaxed">
                    Email akan dikirim secara personal (1 penerima per email) dalam <strong>{totalBatches} batch</strong> dengan jeda aman 1 detik untuk melindungi reputasi akun Gmail Anda dari filter spam.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                {recipients.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartSending}
                    className="px-5 py-2 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#d6852a] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Mulai Kirim Sekarang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SENDING PROGRESS */}
          {step === "sending" && (
            <div className="py-4 space-y-5">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-800">
                  Sedang Mengirim Notifikasi Email...
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Memproses batch {currentBatchNum} dari {totalBatches} (jeda ~1s antar pengiriman)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Progres Pengiriman</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-[#F7A440] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>{processedCount} dari {recipients.length} anggota</span>
                  <span className="text-emerald-600 font-bold">✓ {sentSuccessCount} sukses</span>
                  {failedCount > 0 && (
                    <span className="text-rose-600 font-bold">✕ {failedCount} gagal</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 text-center">
                Mohon jangan menutup jendela ini sampai seluruh proses pengiriman selesai.
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleAbort}
                  className="px-4 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                >
                  Hentikan Pengiriman
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETE */}
          {step === "complete" && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-800">
                  Pengiriman Selesai!
                </h4>
                <p className="text-xs text-slate-500">
                  {isAbortedRef.current
                    ? "Pengiriman dihentikan oleh pengguna."
                    : "Notifikasi agenda telah berhasil didistribusikan ke kotak masuk anggota."}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[11px] font-bold text-emerald-800 block">Berhasil Terkirim</span>
                  <span className="text-xl font-extrabold text-emerald-600">{sentSuccessCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] font-bold text-slate-600 block">Gagal / Dilewati</span>
                  <span className="text-xl font-extrabold text-slate-700">{failedCount}</span>
                </div>
              </div>

              {batchErrors.length > 0 && (
                <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-700 max-h-28 overflow-y-auto space-y-1">
                  <strong className="block font-bold">Catatan Gagal:</strong>
                  {batchErrors.map((err, idx) => (
                    <div key={idx} className="truncate">
                      • {err.email || err.id || "Error"}: {err.error}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm"
              >
                Selesai & Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

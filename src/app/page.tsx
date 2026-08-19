"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { getStoredEvents, ScheduledEvent } from "@/common/lib/mock-db"

export default function PublicPortal() {
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduledEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load events from database
    const rawEvents = getStoredEvents()
    
    // Filter for today onwards and sort chronologically
    const todayStr = new Date().toISOString().split("T")[0]
    const filtered = rawEvents
      .filter(evt => evt.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 3)

    setUpcomingEvents(filtered)
    setLoading(false)
  }, [])

  const getDayName = (dateStr: string) => {
    const dateObj = new Date(dateStr)
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    return days[dateObj.getDay()] || "Sabtu"
  }

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const formatDateIndonesian = (dateStr: string) => {
    const parts = dateStr.split("-")
    if (parts.length !== 3) return dateStr
    const day = parseInt(parts[2], 10)
    const monthIdx = parseInt(parts[1], 10) - 1
    const year = parts[0]
    const dayName = getDayName(dateStr)
    return `${dayName}, ${day} ${months[monthIdx]} ${year}`
  }

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case "blue":
        return { category: "Kajian", bg: "bg-blue-100 text-blue-800" }
      case "amber":
        return { category: "Musyawarah", bg: "bg-amber-100 text-amber-800" }
      case "emerald":
        return { category: "Kaderisasi", bg: "bg-emerald-100 text-emerald-800" }
      case "purple":
        return { category: "Sosial", bg: "bg-purple-100 text-purple-800" }
      case "red":
        return { category: "Rapat", bg: "bg-red-100 text-red-800" }
      default:
        return { category: "Kegiatan", bg: "bg-slate-100 text-slate-800" }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo HIPPA Cirengit"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <h1 className="font-title-lg text-[18px] font-bold text-slate-900 leading-tight">SIMPA HIPPA</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Cirengit</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Masuk Aplikasi
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950 text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent -z-10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block bg-amber-500/20 text-[#f7a440] font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-amber-500/30">
            Portal Informasi Publik
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Sistem Informasi Manajemen Pengurus & Anggota
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Selamat datang di portal SIMPA Himpunan Pelajar Persatuan Islam (HIPPA) Cirengit. Kami hadir untuk mewujudkan tata kelola organisasi yang tertib, modern, transparan, dan berkelanjutan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#kegiatan"
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg border border-slate-700 transition duration-300"
            >
              Lihat Kegiatan Terdekat
            </a>
            <Link
              href="/login"
              className="px-6 py-3 bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/10 transition duration-300"
            >
              Masuk Dashboard Pengurus
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content - Upcoming Activities */}
      <main id="kegiatan" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kegiatan Terdekat & Mendatang
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Jadwal kegiatan berkala, rapat koordinasi, kajian rutin, dan program kerja Himpunan Pelajar Persatuan Islam (HIPPA) Cirengit.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Memuat kegiatan terdekat...</span>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => {
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <div>
                    {/* Name/Title (No Icon) */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-4 uppercase">
                      {event.title}
                    </h3>

                    {/* Details List (All with Icons except Title) */}
                    <div className="flex flex-col gap-3.5 font-semibold text-xs text-slate-600">
                      {event.type === "kajian" && event.speaker && (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">record_voice_over</span>
                            <span>PEMATERI: <strong className="font-bold text-slate-800">{event.speaker}</strong></span>
                          </div>
                          {event.theme && (
                            <div className="flex items-center gap-2.5">
                              <span className="material-symbols-outlined text-[18px] text-slate-400">topic</span>
                              <span>TEMA: <strong className="font-bold text-slate-800">{event.theme}</strong></span>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                        <span>{formatDateIndonesian(event.date)}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                        <span>{event.time} WIB</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm max-w-md mx-auto">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3">event_busy</span>
            <p className="text-sm text-slate-500 font-bold">Tidak ada agenda kegiatan terdekat saat ini.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo HIPPA Cirengit"
              width={36}
              height={36}
              className="rounded-full grayscale opacity-70 object-cover"
            />
            <div>
              <p className="text-white font-semibold text-sm">SIMPA HIPPA Cirengit</p>
              <p className="text-xs text-slate-500">Himpunan Pelajar Persatuan Islam (Putra) Cirengit</p>
            </div>
          </div>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} PJ. Pemuda Persis Cirengit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

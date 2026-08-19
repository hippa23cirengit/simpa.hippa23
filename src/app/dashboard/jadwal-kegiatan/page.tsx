"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { getStoredEvents, saveStoredEvents, ScheduledEvent, getCurrentRole } from "@/common/lib/mock-db"

export default function JadwalKegiatan() {
  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const [currentRole, setCurrentRole] = useState("Super Admin")
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date()) // Default: Hari Ini (Agt 2026)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null) // selected YYYY-MM-DD
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null)
  
  // Form State
  const [formTitle, setFormTitle] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formTime, setFormTime] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formColor, setFormColor] = useState("blue")

  const loadData = () => {
    setEvents(getStoredEvents())
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

  const isReadOnly = currentRole === "Anggota"

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Calculate calendar cells
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun, 1 = Mon, etc.
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevMonthTotalDays = new Date(year, month, 0).getDate()

  const calendarCells: { day: number; isCurrentMonth: boolean; dateStr: string; isSunday: boolean; isToday: boolean }[] = []

  // Preceding month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      dateStr,
      isSunday: new Date(prevYear, prevMonth, d).getDay() === 0,
      isToday: false
    })
  }

  // Current month days
  const today = new Date()
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateStr,
      isSunday: new Date(year, month, d).getDay() === 0,
      isToday
    })
  }

  // Succeeding month days to fill grid of 42
  const totalGridCells = 42
  const remainingCells = totalGridCells - calendarCells.length
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      dateStr,
      isSunday: new Date(nextYear, nextMonth, d).getDay() === 0,
      isToday: false
    })
  }

  // Event Color Helpers
  const getColorClass = (color: string) => {
    switch (color) {
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-100"
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-100"
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-100"
      case "red":
        return "bg-red-50 text-red-700 border-red-100"
      case "blue":
      default:
        return "bg-blue-50 text-blue-700 border-blue-100"
    }
  }

  const getDotsColor = (color: string) => {
    switch (color) {
      case "amber": return "bg-amber-500"
      case "emerald": return "bg-emerald-500"
      case "purple": return "bg-purple-500"
      case "red": return "bg-red-500"
      case "blue":
      default: return "bg-blue-500"
    }
  }

  // Calendar Actions
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleGoToToday = () => {
    setCurrentDate(new Date())
    setSelectedDateStr(null)
  }

  // Add/Edit Event Actions
  const handleOpenAdd = () => {
    setEditingEvent(null)
    setFormTitle("")
    setFormDate(selectedDateStr || "")
    setFormTime("")
    setFormLocation("")
    setFormColor("blue")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (event: ScheduledEvent) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormDate(event.date)
    setFormTime(event.time)
    setFormLocation(event.location)
    setFormColor(event.color)
    setIsModalOpen(true)
  }

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDate || !formTime) return

    const rawEvents = getStoredEvents()

    if (editingEvent) {
      const updated = rawEvents.map(evt => {
        if (evt.id === editingEvent.id) {
          return {
            ...evt,
            title: formTitle,
            date: formDate,
            time: formTime,
            location: formLocation,
            color: formColor
          }
        }
        return evt
      })
      saveStoredEvents(updated)
    } else {
      const newEvent: ScheduledEvent = {
        id: `evt-${Date.now()}`,
        title: formTitle,
        date: formDate,
        time: formTime,
        location: formLocation,
        color: formColor
      }
      saveStoredEvents([...rawEvents, newEvent])
    }

    setIsModalOpen(false)
    loadData()
  }

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus agenda "${eventTitle}"?`)) {
      const rawEvents = getStoredEvents()
      const filtered = rawEvents.filter(evt => evt.id !== eventId)
      saveStoredEvents(filtered)
      loadData()
    }
  }

  // Filter side activities
  const displayedEvents = events.filter(evt => {
    if (selectedDateStr) {
      return evt.date === selectedDateStr
    }
    // Default show all events in the displayed month and after
    const eventDate = new Date(evt.date)
    return eventDate.getMonth() === month && eventDate.getFullYear() === year
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const formatDateDisplay = (dateString: string) => {
    const parts = dateString.split("-")
    if (parts.length !== 3) return dateString
    const d = parseInt(parts[2])
    const m = parseInt(parts[1]) - 1
    const y = parts[0]
    return `${d} ${months[m]} ${y}`
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Left Column: Calendar View */}
      <section className="w-full lg:flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 md:p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline-md text-xl md:text-2xl font-bold text-slate-900">
              {months[month]} {year}
            </h2>
            <p className="font-body-md text-xs text-slate-500 mt-1">Jadwal kegiatan rutin dan khusus.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={handleGoToToday}
              className="px-4 py-2 font-label-md text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="w-full">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-label-md text-xs text-slate-400 py-2 font-bold uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1 border-t border-l border-slate-200/80">
            {calendarCells.map((cell, idx) => {
              const cellBg = !cell.isCurrentMonth
                ? "bg-slate-50 opacity-40"
                : cell.isToday
                ? "bg-[#F7A440]/5"
                : selectedDateStr === cell.dateStr
                ? "bg-amber-50"
                : "bg-white"

              const cellEvents = events.filter(evt => evt.date === cell.dateStr)

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[90px] md:min-h-[110px] p-1 border-r border-b border-slate-200/80 ${cellBg} flex flex-col justify-between cursor-pointer hover:bg-slate-50/50 transition-colors`}
                >
                  <div className="flex justify-between items-start">
                    {cell.isToday ? (
                      <span className="font-bold text-xs bg-[#F7A440] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                        {cell.day}
                      </span>
                    ) : (
                      <span className={`font-semibold text-xs p-1 ${cell.isSunday ? "text-red-600 font-bold" : "text-slate-700"}`}>
                        {cell.day}
                      </span>
                    )}
                    {cellEvents.length > 0 && (
                      <div className="flex gap-0.5 p-1">
                        {cellEvents.slice(0, 3).map(e => (
                          <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${getDotsColor(e.color)}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Event labels inside cell (Desktop) */}
                  <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                    {cellEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`hidden md:block px-1.5 py-0.5 rounded text-[9px] font-bold truncate leading-tight border ${getColorClass(event.color)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {cellEvents.length > 2 && (
                      <div className="hidden md:block text-[8px] text-slate-400 font-bold px-1.5">
                        +{cellEvents.length - 2} Lainnya
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Right Column: Actions & Event Lists */}
      <aside className="w-full lg:w-[360px] flex flex-col gap-6">
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="w-full bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition duration-300 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Kegiatan
          </button>
        )}

        {/* Activity List Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col w-full">
          <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-title-lg text-sm font-bold text-slate-900">
              {selectedDateStr ? `Agenda Tanggal` : `Agenda Bulan Ini`}
            </h3>
            {selectedDateStr && (
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-xs text-[#F7A440] hover:text-[#e09132] font-bold"
              >
                Lihat Semua
              </button>
            )}
          </div>
          
          <div className="flex flex-col p-4 gap-4 max-h-[400px] overflow-y-auto">
            {selectedDateStr && displayedEvents.length === 0 && (
              <p className="text-xs text-center text-slate-400 font-semibold py-8">
                Tidak ada agenda kegiatan untuk tanggal {formatDateDisplay(selectedDateStr)}.
              </p>
            )}
            {!selectedDateStr && displayedEvents.length === 0 && (
              <p className="text-xs text-center text-slate-400 font-semibold py-8">
                Tidak ada agenda kegiatan di bulan ini.
              </p>
            )}
            
            {displayedEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 border border-slate-200/80 hover:border-amber-400 rounded-xl bg-slate-50/30 transition-all duration-300 flex flex-col`}
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{event.title}</h4>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider whitespace-nowrap ${getColorClass(event.color)}`}>
                    {event.color}
                  </span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
                    <span>{formatDateDisplay(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                    <span>{event.time} WIB</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                      <span className="text-slate-700">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Edit/Delete Actions */}
                {!isReadOnly && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="text-slate-400 hover:text-[#F7A440] transition-colors p-1 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span className="text-[10px] font-bold">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.title)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span className="text-[10px] font-bold">Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Modal Form Tambah / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-title-lg text-base font-bold text-slate-800">
                {editingEvent ? "Edit Agenda Kegiatan" : "Tambah Agenda Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent}>
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Judul Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Rapat Pleno Mingguan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai *</label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Tempat</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Masjid Al-Hikmah"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warna Label Kategori</label>
                  <div className="flex gap-3 mt-2">
                    {["blue", "amber", "emerald", "purple", "red"].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`w-7 h-7 rounded-full border-2 ${
                          c === "blue" ? "bg-blue-500" :
                          c === "amber" ? "bg-amber-500" :
                          c === "emerald" ? "bg-emerald-500" :
                          c === "purple" ? "bg-purple-500" : "bg-red-500"
                        } ${formColor === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F7A440] hover:bg-[#e09132] text-white font-bold rounded-lg text-xs transition duration-200 shadow-sm"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

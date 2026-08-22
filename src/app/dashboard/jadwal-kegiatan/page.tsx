"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  getStoredEvents,
  saveStoredEvents,
  ScheduledEvent,
  getCurrentRole,
  getStoredAcl,
  getWaTemplateKajian,
  getWaTemplateUmum,
  getWaConfig,
  syncDatabaseFromServer
} from "@/common/lib/mock-db"
import { useDialog } from "@/common/components/dialog-provider"

export default function JadwalKegiatan() {
  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  
  const { showAlert, showConfirm } = useDialog()
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
  const [formType, setFormType] = useState<"kajian" | "umum">("umum")
  const [formSpeaker, setFormSpeaker] = useState("")
  const [formTheme, setFormTheme] = useState("")

  // Broadcast state
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  // Tooltip/Popover States
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null)
  const [clickedDateStr, setClickedDateStr] = useState<string | null>(null)
  const [longPressedDateStr, setLongPressedDateStr] = useState<string | null>(null)

  // Refs for mobile long press
  const longPressTimeoutRef = React.useRef<any>(null)
  const isLongPressActive = React.useRef(false)

  const handleTouchStart = (dateStr: string) => {
    isLongPressActive.current = false;
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      setLongPressedDateStr(dateStr);
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent, dateStr: string) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (isLongPressActive.current) {
      e.preventDefault();
      setLongPressedDateStr(null);
      isLongPressActive.current = false;
    } else {
      setSelectedDateStr(dateStr);
      setClickedDateStr(null); // Clear active locked popovers on standard tap
    }
  };

  const handleTouchMove = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setLongPressedDateStr(null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach((id) => {
          if (next[id] > 0) {
            next[id] -= 1;
            updated = true;
          } else {
            delete next[id];
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getNotificationStatus = (event: ScheduledEvent) => {
    const notifCount = event.notificationCount || 0;
    
    // Parse time in WIB (UTC+7)
    const eventTimeMs = new Date(`${event.date}T${event.time}:00+07:00`).getTime();
    const nowMs = Date.now();
    const diffMs = eventTimeMs - nowMs;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (diffMs <= 0) {
      return { status: "past", label: "Acara Selesai", disabled: true, color: "text-slate-400 hover:text-slate-400" };
    }
    
    if (notifCount >= 2) {
      return { status: "completed", label: "Notif Terkirim (2/2)", disabled: true, color: "text-emerald-600 font-bold hover:text-emerald-600" };
    }

    if (diffMs <= twoHoursMs) {
      if (notifCount === 0) {
        return { status: "system-active", label: "Sistem Otomatis Aktif", disabled: true, color: "text-amber-600 font-bold hover:text-amber-600" };
      } else {
        return { status: "completed-half", label: "Notif Terkirim (1/2)", disabled: true, color: "text-amber-500 font-bold hover:text-amber-500" };
      }
    }

    // Waktu masih > 2 jam
    if (notifCount === 0) {
      return { status: "active-first", label: "Kirim Pemberitahuan", disabled: false, color: "text-blue-600 hover:text-blue-700 font-bold" };
    } else {
      return { status: "active-second", label: "Kirim Ulang (1/2)", disabled: false, color: "text-amber-600 hover:text-amber-700 font-bold" };
    }
  };

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

  const activeAcl = getStoredAcl().find(r => r.role === currentRole)
  const isReadOnly = !activeAcl?.permissions.manageJadwalKegiatan

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

  const getMobileBadgeBgColor = (color: string) => {
    switch (color) {
      case "amber": return "bg-amber-500"
      case "emerald": return "bg-emerald-600"
      case "purple": return "bg-purple-600"
      case "red": return "bg-red-600"
      case "blue":
      default: return "bg-blue-600"
    }
  }

  const getBadgeBgColor = (color: string) => {
    switch (color) {
      case "amber": return "bg-amber-500 hover:bg-amber-600"
      case "emerald": return "bg-emerald-600 hover:bg-emerald-700"
      case "purple": return "bg-purple-600 hover:bg-purple-700"
      case "red": return "bg-red-600 hover:bg-red-700"
      case "blue":
      default: return "bg-blue-600 hover:bg-blue-700"
    }
  }

  const getEventBorderColorHex = (color: string) => {
    switch (color) {
      case "amber": return "#f59e0b"
      case "emerald": return "#10b981"
      case "purple": return "#8b5cf6"
      case "red": return "#ef4444"
      case "blue":
      default: return "#3b82f6"
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
    setFormType("umum")
    setFormSpeaker("")
    setFormTheme("")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (event: ScheduledEvent) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormDate(event.date)
    setFormTime(event.time)
    setFormLocation(event.location)
    setFormColor(event.color)
    setFormType(event.type || "umum")
    setFormSpeaker(event.speaker || "")
    setFormTheme(event.theme || "")
    setIsModalOpen(true)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDate || !formTime) return

    // Validasi: Tidak boleh membuat/mengedit kegiatan di tanggal masa lalu
    const todayStr = new Date().toISOString().split("T")[0] // YYYY-MM-DD hari ini
    if (!editingEvent && formDate < todayStr) {
      await showAlert("Tidak dapat membuat kegiatan di tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.", "Tanggal Tidak Valid", "danger")
      return
    }

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
            color: formColor,
            type: formType,
            speaker: formType === "kajian" ? formSpeaker : "",
            theme: formType === "kajian" ? formTheme : ""
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
        color: formColor,
        type: formType,
        speaker: formType === "kajian" ? formSpeaker : "",
        theme: formType === "kajian" ? formTheme : ""
      }
      saveStoredEvents([...rawEvents, newEvent])
    }

    setIsModalOpen(false)
    loadData()
  }

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    const confirmed = await showConfirm(`Apakah Anda yakin ingin menghapus agenda "${eventTitle}"?`, "Hapus Agenda", "danger")
    if (confirmed) {
      const rawEvents = getStoredEvents()
      const filtered = rawEvents.filter(evt => evt.id !== eventId)
      saveStoredEvents(filtered)
      loadData()
    }
  }

  // Broadcast to WA Queue
  const handleBroadcastEvent = async (event: ScheduledEvent) => {
    const confirmed = await showConfirm(`Apakah Anda yakin ingin mengirim notifikasi WhatsApp untuk kegiatan "${event.title}" ke seluruh anggota aktif?`, "Kirim Notifikasi", "warning")
    if (!confirmed) {
      return
    }

    setBroadcastingId(event.id)

    try {
      const response = await fetch(`/api/kegiatan/${event.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      const data = await response.json()
      setBroadcastingId(null)

      if (data.status === true) {
        await showAlert("Notifikasi berhasil dimasukkan ke antrean! Pesan akan terkirim secara bertahap (1 menit per pesan) di latar belakang.", "Berhasil", "success")
        
        // Start 10s cooldown
        setCooldowns((prev) => ({ ...prev, [event.id]: 10 }))
        
        // Sync database and reload
        await syncDatabaseFromServer()
        loadData()
      } else {
        await showAlert(`Gagal memicu notifikasi: ${data.reason || "Alasan tidak diketahui"}`, "Gagal", "danger")
      }
    } catch (err: any) {
      setBroadcastingId(null)
      await showAlert(`Terjadi kesalahan jaringan: ${err.message || err}`, "Kesalahan", "danger")
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
              const isSelected = selectedDateStr === cell.dateStr
              const cellEvents = events.filter(evt => evt.date === cell.dateStr)

              // Best Scenario Layout: Clean backgrounds with high contrast colored badges
              let cellBg = "bg-white hover:bg-slate-50"
              if (!cell.isCurrentMonth) {
                cellBg = "bg-slate-50/60 opacity-50"
              } else if (cell.isToday) {
                cellBg = "bg-amber-500/5 font-bold"
              } else if (isSelected) {
                cellBg = "bg-slate-50/50"
              }

              let borderOutline = "hover:ring-1 hover:ring-inset hover:ring-amber-300"
              if (isSelected) {
                borderOutline = "ring-2 ring-inset ring-[#F7A440] shadow-sm z-10 rounded-sm"
              }

              const isHovered = hoveredDateStr === cell.dateStr
              const isClicked = clickedDateStr === cell.dateStr
              const isLongPressed = longPressedDateStr === cell.dateStr
              const showPopup = (isHovered || isClicked || isLongPressed) && cellEvents.length > 0

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDateStr(cell.dateStr)
                    if (cellEvents.length > 0) {
                      // Toggle click lock on PC
                      setClickedDateStr(clickedDateStr === cell.dateStr ? null : cell.dateStr)
                    }
                  }}
                  onMouseEnter={() => setHoveredDateStr(cell.dateStr)}
                  onMouseLeave={() => setHoveredDateStr(null)}
                  onTouchStart={() => handleTouchStart(cell.dateStr)}
                  onTouchEnd={(e) => handleTouchEnd(e, cell.dateStr)}
                  onTouchMove={handleTouchMove}
                  className={`min-h-[90px] md:min-h-[110px] p-1.5 border-r border-b border-slate-200/80 ${cellBg} ${borderOutline} flex flex-col justify-between cursor-pointer transition-all duration-150 relative`}
                >
                  <div className="flex justify-between items-start">
                    {cell.isToday ? (
                      <span className="font-extrabold text-xs bg-[#1A1A1A] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md ring-2 ring-amber-400">
                        {cell.day}
                      </span>
                    ) : (
                      <span className={`font-semibold text-xs p-0.5 ${cell.isSunday ? "text-red-600 font-bold" : "text-slate-700"}`}>
                        {cell.day}
                      </span>
                    )}
                  </div>
                  
                  {/* Event labels inside cell (Desktop filled badges & Mobile solid horizontal bars) */}
                  <div className="mt-1 flex flex-col gap-1 overflow-hidden w-full">
                    {/* Desktop View */}
                    {cellEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`hidden md:block text-[9px] font-bold truncate leading-snug px-1.5 py-0.5 rounded text-white shadow-sm transition-colors ${getBadgeBgColor(event.color)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {cellEvents.length > 2 && (
                      <div className="hidden md:block text-[8px] text-slate-500 font-bold px-1 mt-0.5">
                        +{cellEvents.length - 2} lainnya
                      </div>
                    )}

                    {/* Mobile View: Solid horizontal bar indicator, placed below the date, never overlaps */}
                    {cellEvents.length > 0 && (
                      <div className="md:hidden flex flex-col gap-1 w-full px-0.5 mt-0.5">
                        {cellEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`h-2.5 w-full rounded-sm shadow-sm ${getMobileBadgeBgColor(event.color)}`}
                          />
                        ))}
                        {cellEvents.length > 3 && (
                          <div className="text-[7.5px] text-slate-400 font-extrabold text-center leading-none mt-0.5">
                            +{cellEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Popup/Tooltip Detail Kegiatan (Hover, Click, Longpress) */}
                  {showPopup && (
                    <div 
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[250px] sm:w-[300px] bg-white/95 backdrop-blur-[4px] border border-slate-200 shadow-xl rounded-xl p-4 z-50 animate-fadeIn pointer-events-auto flex flex-col text-left cursor-default gap-3"
                      onClick={(e) => e.stopPropagation()} // Prevent cell click trigger
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {formatDateDisplay(cell.dateStr)}
                        </span>
                        {isClicked && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClickedDateStr(null);
                            }}
                            className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </div>
                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {cellEvents.map((event) => (
                          <div key={event.id} className="text-left border-l-[3px] pl-2.5 py-0.5 space-y-1" style={{ borderColor: getEventBorderColorHex(event.color) }}>
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-extrabold text-slate-800 text-[11px] leading-snug">{event.title}</h5>
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider whitespace-nowrap shrink-0 ${getColorClass(event.color)}`}>
                                {event.color}
                              </span>
                            </div>
                            
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              {event.type === "kajian" ? "📚 Kajian / Seminar" : "🏃‍♂️ Acara Umum"}
                            </div>

                            <div className="space-y-1 text-[9.5px] text-slate-500 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px] text-slate-400">schedule</span>
                                <span>{event.time} WIB</span>
                              </div>
                              {event.location && (
                                <div className="flex items-start gap-1.5">
                                  <span className="material-symbols-outlined text-[12px] text-slate-400 mt-0.5">location_on</span>
                                  <span className="text-slate-600 leading-normal break-words">{event.location}</span>
                                </div>
                              )}
                              {event.type === "kajian" && (
                                <div className="flex flex-col gap-0.5 mt-1 py-1 px-2 bg-amber-500/5 border border-amber-200/30 rounded-lg text-[#895200]">
                                  {event.theme && (
                                    <div className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">topic</span>
                                      <span className="truncate">Tema: <strong className="font-extrabold">{event.theme}</strong></span>
                                    </div>
                                  )}
                                  {event.speaker && (
                                    <div className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">record_voice_over</span>
                                      <span className="truncate">Ust: <strong className="font-extrabold">{event.speaker}</strong></span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{event.title}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                      {event.type === "kajian" ? "📚 Kajian/Seminar" : "🏃‍♂️ Acara Umum"}
                    </span>
                  </div>
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
                  {event.type === "kajian" && (
                    <div className="flex flex-col gap-1 mt-1.5 py-1.5 px-2.5 bg-amber-500/5 border border-amber-200/50 rounded-lg text-[#895200]">
                      {event.theme && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[15px]">topic</span>
                          <span>Tema: <strong className="font-bold">{event.theme}</strong></span>
                        </div>
                      )}
                      {event.speaker && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[15px]">record_voice_over</span>
                          <span>Ustadz/Pemateri: <strong className="font-bold">{event.speaker}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  {(() => {
                    const statusInfo = getNotificationStatus(event);
                    const cd = cooldowns[event.id] || 0;
                    const isDisabled = statusInfo.disabled || cd > 0 || broadcastingId === event.id;
                    const displayLabel = cd > 0 ? `${statusInfo.label} (${cd}s)` : statusInfo.label;

                    return (
                      <button
                        onClick={() => handleBroadcastEvent(event)}
                        disabled={isDisabled}
                        className={`transition-colors flex items-center gap-1 text-[10px] ${statusInfo.color} disabled:text-slate-400 disabled:opacity-75`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {statusInfo.status === "past" 
                            ? "block" 
                            : statusInfo.status.startsWith("completed") 
                            ? "check_circle" 
                            : statusInfo.status === "system-active" 
                            ? "history" 
                            : "send_to_mobile"}
                        </span>
                        <span className="font-bold">{broadcastingId === event.id ? "Mengirim..." : displayLabel}</span>
                      </button>
                    )
                  })()}

                  {!isReadOnly && (
                    <div className="flex gap-2">
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
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Modal Form Tambah / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
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
            
            <form onSubmit={handleSaveEvent} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-grow max-h-[calc(90vh-130px)] scrollbar-thin">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kegiatan *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("umum")
                        setFormColor("amber")
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                        formType === "umum"
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      Umum / Rapat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("kajian")
                        setFormColor("blue")
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                        formType === "kajian"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">menu_book</span>
                      Kajian / Seminar
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Judul Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={formType === "kajian" ? "Contoh: Peran Pemuda di Era Digital" : "Contoh: Rapat Pleno Mingguan"}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                  />
                </div>

                {/* Speaker & Theme fields (Dynamic for Kajian) */}
                {formType === "kajian" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tema Kajian (Opsional)</label>
                      <input
                        type="text"
                        value={formTheme}
                        onChange={(e) => setFormTheme(e.target.value)}
                        placeholder="Contoh: Fikih Dakwah Pemuda"
                        className="w-full px-3 py-2 border border-[#F7A440]/60 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemateri / Ustadz *</label>
                      <input
                        type="text"
                        required
                        value={formSpeaker}
                        onChange={(e) => setFormSpeaker(e.target.value)}
                        placeholder="Contoh: Ustadz Adi Hidayat, Lc."
                        className="w-full px-3 py-2 border border-[#F7A440]/60 rounded-lg text-sm focus:outline-none focus:border-[#F7A440] transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      min={!editingEvent ? new Date().toISOString().split("T")[0] : undefined}
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
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
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

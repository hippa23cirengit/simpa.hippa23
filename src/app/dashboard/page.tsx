"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStoredMembers,
  getStoredTasykil,
  getStoredEvents,
  getPeriodeJabatan,
  ScheduledEvent
} from "@/common/lib/mock-db";

interface Member {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface Applicant {
  id: string;
  name: string;
  status: string;
}

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [periodeJabatan, setPeriodeJabatan] = useState("2026 - 2028");
  const [ketuaName, setKetuaName] = useState("-");
  const [sekretarisName, setSekretarisName] = useState("-");
  const [loading, setLoading] = useState(true);

  const loadDashboardData = () => {
    const rawMembers = getStoredMembers();
    setMembers(rawMembers);

    const tasykil = getStoredTasykil();
    const ketuaObj = rawMembers.find((m) => m.id === tasykil.pimhar.ketua);
    const sekObj = rawMembers.find((m) => m.id === tasykil.pimhar.sekretaris);

    setKetuaName(ketuaObj ? ketuaObj.name : "-");
    setSekretarisName(sekObj ? sekObj.name : "-");

    const storedApplicants = localStorage.getItem("simpa_calon_anggota");
    if (storedApplicants) {
      try {
        setApplicants(JSON.parse(storedApplicants));
      } catch (e) { }
    }

    setEvents(getStoredEvents());
    setPeriodeJabatan(getPeriodeJabatan());
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();

    const handleDataChange = () => {
      loadDashboardData();
    };

    window.addEventListener("simpa_role_changed", handleDataChange);
    return () => {
      window.removeEventListener("simpa_role_changed", handleDataChange);
    };
  }, []);

  // Calculate stats
  const totalAnggota = members.length;
  const pengurusAktif = members.filter((m) => m.role !== "-").length;
  const calonAnggota = applicants.filter(
    (a) => a.status === "Menunggu" || a.status === "Proses"
  ).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const stats = [
    {
      name: "TOTAL ANGGOTA",
      value: String(totalAnggota),
      icon: "groups",
      bg: "bg-amber-500/10 text-[#F7A440]",
    },
    {
      name: "PENGURUS AKTIF",
      value: String(pengurusAktif),
      icon: "how_to_reg",
      bg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      name: "CALON ANGGOTA",
      value: String(calonAnggota),
      icon: "person_add",
      bg: "bg-orange-500/10 text-orange-600",
    },
    {
      name: "KEGIATAN MENDATANG",
      value: String(upcomingEvents.length),
      icon: "event",
      bg: "bg-blue-500/10 text-blue-600",
    },
  ];

  // Get up to 3 most recently added members
  const recentMembers = [...members]
    .reverse()
    .slice(0, 3)
    .map((m) => {
      let statusBg = "bg-emerald-100 text-emerald-800";
      if (m.status === "Tidak Aktif") statusBg = "bg-red-100 text-red-800";
      if (m.status === "Alumni") statusBg = "bg-amber-100 text-amber-800";

      return {
        id: m.id,
        name: m.name,
        role: m.role === "-" ? "Anggota Biasa" : m.role,
        status: m.status,
        statusBg: statusBg,
        avatarColor:
          m.id === "26.0000"
            ? "bg-amber-500/10 text-[#895200] border-amber-200"
            : "bg-slate-50 text-slate-700 border-slate-200",
      };
    });

  const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

  const formatMonthShort = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length < 2) return "Agt";
    const mIdx = parseInt(parts[1], 10) - 1;
    return monthShortNames[mIdx] || "Agt";
  };

  const formatDayNum = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length < 3) return "01";
    return parts[2];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold">Memuat Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">
          Assalamu'alaikum Pelajar!, Selamat Datang di SIMPA 👋
        </h2>
        <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">
          Sistem Informasi Manajemen Pengurus dan Anggota HIPPA
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
              <span className="material-symbols-outlined fill text-[24px]">
                {stat.icon}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{stat.name}</p>
              <p className="font-headline-md text-xl md:text-2xl font-bold text-slate-800 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kegiatan Mendatang (Left Col - Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 bg-transparent">
              <h3 className="font-title-lg text-base md:text-lg font-bold text-slate-900">Kegiatan Mendatang</h3>
              <Link
                href="/dashboard/jadwal-kegiatan"
                className="font-label-md text-xs font-bold text-[#F7A440] hover:text-[#e09132] transition-colors flex items-center gap-1"
              >
                Lihat Kalender
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Timeline Cards Grid (Dinamis dari events riil) */}
            <div className="flex flex-col gap-4">
              {upcomingEvents.slice(0, 3).map((item) => (
                <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F7A440]/10 text-[#F7A440] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase">{formatMonthShort(item.date)}</span>
                    <span className="text-lg font-extrabold leading-none">{formatDayNum(item.date)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {item.time} WIB
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {item.location}
                    </p>
                  </div>
                </div>
              ))}

              {upcomingEvents.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Tidak ada agenda kegiatan mendatang.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100/60 text-xs text-slate-400 font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#F7A440]">info</span>
            <span>Jadwal di atas disinkronkan otomatis dengan kalender kegiatan HIPPA Cirengit.</span>
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="flex flex-col gap-6">
          {/* Anggota Terbaru */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-title-lg text-base font-bold text-slate-900">Anggota Terbaru</h3>
              <Link
                href="/dashboard/data-anggota"
                className="text-xs font-bold text-[#F7A440] hover:text-[#e09132] transition-colors"
              >
                Lihat Semua
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {recentMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${member.avatarColor}`}>
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{member.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                      {member.role} • {member.id}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${member.statusBg} shrink-0`}>
                    {member.status}
                  </span>
                </div>
              ))}
              {recentMembers.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">Belum ada anggota terdaftar.</p>
              )}
            </div>
          </div>

          {/* Org Summary */}
          <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
            <h3 className="font-title-lg text-base md:text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Ringkasan Kepengurusan
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Ketua Umum</span>
                <span className="font-semibold text-slate-800">{ketuaName === "-" ? "Belum ditentukan" : ketuaName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sekretaris</span>
                <span className="font-semibold text-slate-800">{sekretarisName === "-" ? "Belum ditentukan" : sekretarisName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Periode Jabatan</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded text-xs">
                  {periodeJabatan}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/tasykil"
              className="w-full mt-5 py-2.5 border border-[#1A1A1A] hover:bg-slate-100 text-[#1A1A1A] font-bold text-xs rounded-xl transition duration-300 flex items-center justify-center"
            >
              Lihat Struktur Lengkap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

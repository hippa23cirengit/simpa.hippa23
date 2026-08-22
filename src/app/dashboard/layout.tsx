"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getCurrentRole, getStoredAcl, syncDatabaseFromServer, getStoredAccounts, getStoredMembers, getStoredEvents, getStoredApplicants } from "@/common/lib/mock-db"
import { isLoggedIn, getSessionUser, clearSession } from "@/common/lib/auth"
import { useDialog } from "@/common/components/dialog-provider"
import { useSessionTimeout } from "@/modules/auth/hooks/use-session-timeout"

// Child content wrapper to access useSidebar safely
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, openMobile } = useSidebar();
  const { showAlert } = useDialog();

  // Activate session timeout check
  useSessionTimeout();

  const [currentRole, setCurrentRoleState] = React.useState("Super Admin");
  const [aclRules, setAclRules] = React.useState<any[]>([]);
  const [authorized, setAuthorized] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userPhoto, setUserPhoto] = React.useState("");
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  // Swipe & dismiss notification states
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [swipingId, setSwipingId] = React.useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = React.useState<number>(0);
  const [dismissingId, setDismissingId] = React.useState<string | null>(null);

  // Load dismissed notifications from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("simpa_dismissed_notifications");
      if (stored) {
        try {
          setDismissedIds(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const dismissNotification = (id: string) => {
    setDismissingId(id);
    setTimeout(() => {
      setDismissedIds(prev => {
        const next = [...prev, id];
        if (typeof window !== "undefined") {
          localStorage.setItem("simpa_dismissed_notifications", JSON.stringify(next));
        }
        return next;
      });
      setDismissingId(null);
    }, 300); // Wait for transition
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setTouchStart(e.targetTouches[0].clientX);
    setSwipingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    setSwipeOffset(diff);
  };

  const handleTouchEnd = () => {
    if (swipingId) {
      if (Math.abs(swipeOffset) > 80) {
        dismissNotification(swipingId);
      }
    }
    setTouchStart(null);
    setSwipingId(null);
    setSwipeOffset(0);
  };

  const loadUserData = () => {
    const user = getSessionUser();
    console.log("[DEBUG UserData] session user:", user);
    if (user && user.name) {
      setUserName(user.name);
      const accounts = getStoredAccounts();
      const acc = accounts.find(a => a.npa === user.npa);
      console.log("[DEBUG UserData] found account:", acc);
      if (acc && acc.linkedAnggotaId) {
        const members = getStoredMembers();
        const mem = members.find(m => m.id === acc.linkedAnggotaId);
        console.log("[DEBUG UserData] found member:", mem);
        if (mem) {
          setUserPhoto(mem.profilePhoto || "/default pic.webp");
        } else {
          setUserPhoto("/default pic.webp");
        }
      }
    }
  }

  React.useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);

    // Initial database synchronization from server disk
    const performInitialSync = async () => {
      setInitialLoading(true);
      await syncDatabaseFromServer();
      loadUserData();
      setCurrentRoleState(getCurrentRole());
      setAclRules(getStoredAcl());
      setInitialLoading(false);
    };

    performInitialSync();

    const handleRoleChange = () => {
      if (!isLoggedIn()) {
        router.replace("/login");
        return;
      }
      loadUserData();
      setCurrentRoleState(getCurrentRole());
      setAclRules(getStoredAcl());
    };

    const handleSyncStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.status === "syncing") {
        setIsSyncing(true);
      } else if (detail.status === "success") {
        setIsSyncing(false);
        loadUserData();
      } else if (detail.status === "error") {
        setIsSyncing(false);
        showAlert(`Gagal sinkronisasi data ke Database:\n${detail.error}`, "Sinkronisasi Gagal", "danger");
      }
    };

    window.addEventListener("simpa_role_changed", handleRoleChange);
    window.addEventListener("simpa_sync_status", handleSyncStatus as EventListener);
    
    return () => {
      window.removeEventListener("simpa_role_changed", handleRoleChange);
      window.removeEventListener("simpa_sync_status", handleSyncStatus as EventListener);
    };
  }, [router]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !authorized) return;

    const checkNotifications = () => {
      const list: any[] = [];
      
      // 1. Check Events
      try {
        const events = getStoredEvents();
        const now = new Date();
        events.forEach(e => {
          if (!e.date || !e.time) return;
          const eventDate = new Date(`${e.date}T${e.time}:00`);
          const diffMs = eventDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          
          if (diffHours > 0 && diffHours <= 24) {
            list.push({
              id: `event-${e.id}`,
              type: "event",
              title: "Jadwal Terdekat",
              message: `${e.title} akan dimulai dalam ${Math.round(diffHours)} jam (${e.time} WIB)`,
              link: "/dashboard/jadwal-kegiatan",
              icon: "calendar_month",
              color: "text-amber-600 bg-amber-50"
            });
          }
        });
      } catch (err) {
        console.error("Gagal membaca notifikasi event:", err);
      }

      // 2. Check Applicants
      try {
        const applicants = getStoredApplicants();
        applicants.forEach(a => {
          if (a.status === "Menunggu") {
            list.push({
              id: `app-${a.id}`,
              type: "applicant",
              title: "Pendaftaran Baru",
              message: `${a.name} telah mendaftar sebagai calon anggota`,
              link: "/dashboard/calon-anggota",
              icon: "person_add",
              color: "text-blue-600 bg-blue-50"
            });
          }
        });
      } catch (err) {
        console.error("Gagal membaca notifikasi pendaftar:", err);
      }

      // Filter out dismissed notification IDs
      const activeList = list.filter(item => !dismissedIds.includes(item.id));
      setNotifications(activeList);
    };

    checkNotifications();

    window.addEventListener("simpa_role_changed", checkNotifications);
    const interval = setInterval(checkNotifications, 10000);

    return () => {
      window.removeEventListener("simpa_role_changed", checkNotifications);
      clearInterval(interval);
    };
  }, [authorized, dismissedIds]);

  const activeAcl = aclRules.find(r => r.role === currentRole);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Data Anggota", href: "/dashboard/data-anggota", icon: "database" },
    { name: "Jadwal Kegiatan", href: "/dashboard/jadwal-kegiatan", icon: "calendar_month" },
    { name: "Tasykil", href: "/dashboard/tasykil", icon: "groups" },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!activeAcl) return true;
    if (item.href === "/dashboard") return activeAcl.permissions.dashboard;
    if (item.href === "/dashboard/data-anggota") return activeAcl.permissions.viewDataAnggota;
    if (item.href === "/dashboard/tasykil") return activeAcl.permissions.viewTasykil;
    if (item.href === "/dashboard/jadwal-kegiatan") return activeAcl.permissions.viewJadwalKegiatan;
    return true;
  });

  const getSubLabel = () => {
    if (currentRole === "Super Admin") return "Administrator";
    if (currentRole === "PIMHAR") return "Pimpinan Harian";
    if (currentRole.startsWith("Bidang")) return currentRole;
    return "Anggota Biasa";
  };

  if (initialLoading || !authorized) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Image
          src="/logo.png"
          alt="Logo HIPPA Cirengit"
          width={64}
          height={64}
          className="object-contain shrink-0"
          style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        <span className="text-xs tracking-wider text-slate-400 font-bold uppercase animate-pulse">Menghubungkan ke Database...</span>
      </div>
    );
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        {/* ----------------- MOBILE TOP HEADER ----------------- */}
        <header className="md:hidden w-full sticky top-0 bg-white border-b border-[#E2E8F0] z-40 shadow-sm flex justify-between items-center px-4 py-3 h-14">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="HIPPA Logo"
              width={32}
              height={32}
              className="object-contain shrink-0"
            />
            <h1 className="font-title-lg text-base font-bold text-[#F7A440] leading-none">SIMPA</h1>
          </div>
          <div className="flex items-center gap-2">
            
             {/* Bell Icon Dropdown (Mobile) */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#F2F4F6] relative ${isNotifOpen ? "text-[#F7A440] bg-slate-50" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-[8px] font-extrabold text-white rounded-full flex items-center justify-center border border-white animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200/80 shadow-lg py-2 z-50 animate-scaleIn origin-top-right">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Notifikasi</h4>
                      <span className="text-[10px] bg-[#F7A440]/10 text-[#895200] font-bold px-2 py-0.5 rounded-full">
                        {notifications.length} Baru
                      </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                      {notifications.length > 0 ? (
                        notifications.map(n => {
                          const isSwiping = swipingId === n.id;
                          const isDismissing = dismissingId === n.id;
                          const itemStyle = isSwiping
                            ? { transform: `translateX(${swipeOffset}px)`, opacity: 1 - Math.abs(swipeOffset) / 150, transition: "none" }
                            : isDismissing
                            ? { transform: `translateX(${swipeOffset > 0 ? '150%' : '-150%'})`, opacity: 0, maxHeight: 0, padding: 0, margin: 0, overflow: "hidden", transition: "all 0.3s ease" }
                            : { transition: "transform 0.2s ease, opacity 0.2s ease, max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease" };

                          return (
                            <div
                              key={n.id}
                              style={itemStyle}
                              className="relative group overflow-hidden"
                              onTouchStart={(e) => handleTouchStart(e, n.id)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            >
                              <Link
                                href={n.link}
                                onClick={() => setIsNotifOpen(false)}
                                className="flex items-start gap-3 p-3.5 hover:bg-slate-50/50 transition-colors text-left w-full pr-10"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.color}`}>
                                  <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <h5 className="font-bold text-slate-800 text-xs leading-none">{n.title}</h5>
                                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed break-words">{n.message}</p>
                                </div>
                              </Link>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  dismissNotification(n.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center flex flex-col items-center justify-center gap-1.5 text-slate-400">
                          <span className="material-symbols-outlined text-[28px] text-slate-300">notifications_off</span>
                          <span className="text-xs font-bold">Tidak ada notifikasi baru</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#F2F4F6]"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">
                menu
              </span>
            </button>
          </div>
        </header>

        {/* ----------------- DESKTOP TOP HEADER ----------------- */}
        <header className="hidden md:flex h-16 shrink-0 items-center justify-between gap-4 px-6 bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">

            {/* Bell Icon Dropdown (Desktop) */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`text-slate-500 hover:text-[#F7A440] transition-colors p-2 rounded-full hover:bg-slate-50 relative ${isNotifOpen ? "text-[#F7A440] bg-slate-50" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center border border-white animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200/80 shadow-lg py-2 z-50 animate-scaleIn origin-top-right">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Notifikasi</h4>
                      <span className="text-[10px] bg-[#F7A440]/10 text-[#895200] font-bold px-2 py-0.5 rounded-full">
                        {notifications.length} Baru
                      </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                      {notifications.length > 0 ? (
                        notifications.map(n => {
                          const isSwiping = swipingId === n.id;
                          const isDismissing = dismissingId === n.id;
                          const itemStyle = isSwiping
                            ? { transform: `translateX(${swipeOffset}px)`, opacity: 1 - Math.abs(swipeOffset) / 150, transition: "none" }
                            : isDismissing
                            ? { transform: `translateX(${swipeOffset > 0 ? '150%' : '-150%'})`, opacity: 0, maxHeight: 0, padding: 0, margin: 0, overflow: "hidden", transition: "all 0.3s ease" }
                            : { transition: "transform 0.2s ease, opacity 0.2s ease, max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease" };

                          return (
                            <div
                              key={n.id}
                              style={itemStyle}
                              className="relative group overflow-hidden"
                              onTouchStart={(e) => handleTouchStart(e, n.id)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            >
                              <Link
                                href={n.link}
                                onClick={() => setIsNotifOpen(false)}
                                className="flex items-start gap-3 p-3.5 hover:bg-slate-50/50 transition-colors text-left w-full pr-10"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.color}`}>
                                  <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <h5 className="font-bold text-slate-800 text-xs leading-none">{n.title}</h5>
                                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed break-words">{n.message}</p>
                                </div>
                              </Link>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  dismissNotification(n.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center flex flex-col items-center justify-center gap-1.5 text-slate-400">
                          <span className="material-symbols-outlined text-[28px] text-slate-300">notifications_off</span>
                          <span className="text-xs font-bold">Tidak ada notifikasi baru</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="hidden sm:flex flex-col pl-4 border-l border-slate-200 justify-center">
              <span className="text-[9px] font-semibold text-slate-800 tracking-wide mb-0.5">Anda Login Sebagai</span>
              <span className="text-xs font-extrabold text-[#F7A440] uppercase tracking-wider select-none leading-none">
                {getSubLabel()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body Canvas */}
        <main className="flex-grow p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>

        {/* ----------------- MOBILE BOTTOM NAV ----------------- */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#E2E8F0] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center py-2 z-40 px-2 pb-safe">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 text-slate-500 transition-colors ${
                  isActive ? "text-[#F7A440]" : "hover:text-[#F7A440]"
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] ${isActive ? "fill" : ""}`}>
                  {item.icon}
                </span>
                <span className="font-label-md text-[9px] font-bold tracking-tight">{item.name}</span>
              </Link>
            );
          })}
          {/* Mobile bottom nav "Menu" button which toggles sidebar drawer */}
          <button
            onClick={toggleSidebar}
            className={`flex flex-col items-center gap-0.5 text-slate-500 transition-colors ${
              openMobile ? "text-[#F7A440]" : "hover:text-[#F7A440]"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {openMobile ? "close" : "more_horiz"}
            </span>
            <span className="font-label-md text-[9px] font-bold tracking-tight">Menu</span>
          </button>
        </nav>
      </SidebarInset>

      {/* Glassmorphism Sync Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[9999] flex flex-col items-center justify-center gap-3 select-none pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 px-8 py-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 animate-fadeIn">
            <Image
              src="/logo.png"
              alt="Logo HIPPA Cirengit"
              width={40}
              height={40}
              className="object-contain shrink-0"
              style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            />
            <span className="text-xs font-extrabold text-slate-700 tracking-wide">Menyinkronkan ke Database...</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </TooltipProvider>
  )
}

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

import { getCurrentRole, setCurrentRole, getStoredAcl } from "@/common/lib/mock-db"

// Child content wrapper to access useSidebar safely
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, openMobile } = useSidebar();

  const [currentRole, setCurrentRoleState] = React.useState("Super Admin");
  const [aclRules, setAclRules] = React.useState<any[]>([]);

  React.useEffect(() => {
    setCurrentRoleState(getCurrentRole());
    setAclRules(getStoredAcl());

    const handleRoleChange = () => {
      setCurrentRoleState(getCurrentRole());
      setAclRules(getStoredAcl());
    };

    window.addEventListener("simpa_role_changed", handleRoleChange);
    return () => {
      window.removeEventListener("simpa_role_changed", handleRoleChange);
    };
  }, []);

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
    if (item.href === "/dashboard/data-anggota") return activeAcl.permissions.dataAnggota;
    if (item.href === "/dashboard/tasykil") return activeAcl.permissions.tasykil;
    if (item.href === "/dashboard/jadwal-kegiatan") return activeAcl.permissions.jadwalKegiatan;
    return true;
  });

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
  };

  const getSubLabel = () => {
    if (currentRole === "Super Admin") return "Administrator";
    if (currentRole === "PIMHAR") return "Ketua Harian";
    if (currentRole === "Bidang") return "Pengurus Bidang";
    return "Anggota Biasa";
  };

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
              className="rounded-full object-cover"
            />
            <h1 className="font-title-lg text-base font-bold text-[#F7A440] leading-none">SIMPA</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Role Switcher */}
            <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-0.5 text-[10px] font-bold">
              <select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="Super Admin">S.Admin</option>
                <option value="PIMHAR">PIMHAR</option>
                <option value="Bidang">Bidang</option>
                <option value="Anggota">Anggota</option>
              </select>
            </div>
            
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#F2F4F6]">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
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
            {/* Desktop Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#F7A440]">manage_accounts</span>
              <span className="text-slate-400">Simulasi:</span>
              <select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="PIMHAR">PIMHAR</option>
                <option value="Bidang">Bidang</option>
                <option value="Anggota">Anggota</option>
              </select>
            </div>

            <button className="text-slate-500 hover:text-[#F7A440] transition-colors p-2 rounded-full hover:bg-slate-50 relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>
            
            <div className="hidden sm:block pl-4 border-l border-slate-200">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-colors text-left focus:outline-none" />
                  }
                >
                  <div className="text-right">
                    <p className="font-label-md text-xs text-slate-800 font-bold leading-none">Ahmad Fauzan</p>
                    <p className="text-[10px] text-[#F7A440] font-bold leading-none mt-1">{getSubLabel()}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-200 flex items-center justify-center text-xs font-bold text-[#895200]">
                    AF
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 rounded-xl shadow-lg border border-slate-200/80 p-1.5 mt-2" align="end">
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profil")}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-500">account_circle</span>
                    Profil Lengkap
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

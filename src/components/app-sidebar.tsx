"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"


import { getCurrentRole, getStoredAcl, getStoredAccounts, getStoredMembers } from "@/common/lib/mock-db"
import { getSessionUser } from "@/common/lib/auth"
import { NavUser } from "@/components/nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const [currentRole, setCurrentRoleState] = React.useState("Super Admin");
  const [aclRules, setAclRules] = React.useState<any[]>([]);
  const [userData, setUserData] = React.useState({ name: "User", email: "", avatar: "" });

  React.useEffect(() => {
    const loadSidebarUser = () => {
      const sessionUser = getSessionUser();
      if (sessionUser && sessionUser.name) {
        const accounts = getStoredAccounts();
        const acc = accounts.find(a => a.npa === sessionUser.npa);
        let email = "";
        let avatar = "";
        if (acc && acc.linkedAnggotaId) {
          const members = getStoredMembers();
          const mem = members.find(m => m.id === acc.linkedAnggotaId);
          if (mem) {
            email = mem.email || "";
            avatar = mem.profilePhoto || "/default pic.webp";
          }
        }
        setUserData({ name: sessionUser.name, email, avatar });
      }
    };

    loadSidebarUser();
    setCurrentRoleState(getCurrentRole());
    setAclRules(getStoredAcl());

    const handleRoleChange = () => {
      setCurrentRoleState(getCurrentRole());
      setAclRules(getStoredAcl());
      loadSidebarUser();
    };

    window.addEventListener("simpa_role_changed", handleRoleChange);
    return () => {
      window.removeEventListener("simpa_role_changed", handleRoleChange);
    };
  }, []);

  const activeAcl = aclRules.find(r => r.role === currentRole);

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
    { title: "Data Anggota", url: "/dashboard/data-anggota", icon: "database" },
    { title: "Tasykil", url: "/dashboard/tasykil", icon: "groups" },
    { title: "Calon Anggota", url: "/dashboard/calon-anggota", icon: "person_add" },
    { title: "Jadwal Kegiatan", url: "/dashboard/jadwal-kegiatan", icon: "calendar_month" },
    { title: "Keuangan", url: "/dashboard/keuangan", icon: "account_balance_wallet" },
    { title: "Role & Akses", url: "/dashboard/role-akses", icon: "admin_panel_settings" },
    { title: "Pengaturan Sistem", url: "/dashboard/pengaturan-sistem", icon: "settings_applications" },
    { title: "Pengaturan WhatsApp", url: "/dashboard/pengaturan-wa", icon: "chat" },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (currentRole === "Super Admin") return true; // VIP Bypass: Super Admin sees EVERYTHING
    
    if (item.url === "/dashboard/role-akses") {
      return false; // Only Super Admin has access to ACL rules, which is handled above
    }
    
    if (!activeAcl) return true;
    if (item.url === "/dashboard") return activeAcl.permissions.dashboard;
    if (item.url === "/dashboard/data-anggota") return activeAcl.permissions.viewDataAnggota;
    if (item.url === "/dashboard/tasykil") return activeAcl.permissions.viewTasykil;
    if (item.url === "/dashboard/calon-anggota") return activeAcl.permissions.viewCalonAnggota;
    if (item.url === "/dashboard/jadwal-kegiatan") return activeAcl.permissions.viewJadwalKegiatan;
    if (item.url === "/dashboard/keuangan") return activeAcl.permissions.viewKeuangan;
    if (item.url === "/dashboard/pengaturan-sistem") return activeAcl.permissions.viewPengaturanSistem;
    if (item.url === "/dashboard/pengaturan-wa") return activeAcl.permissions.viewPengaturanWa;
    return true;
  });

  const getSubLabel = () => {
    if (currentRole === "Anggota") return "Anggota";
    return currentRole;
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-slate-100 p-4 transition-all duration-200 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-1.5">
          <Image
            src="/logo.png"
            alt="Logo"
            width={44}
            height={44}
            className="object-contain shrink-0"
          />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-slate-800">SIMPA HIPPA</span>
            <span className="block text-[9px] font-semibold text-[#F7A440] uppercase tracking-wider leading-tight whitespace-normal break-words mt-0.5">Sistem Informasi Manajemen Pengurus & Anggota</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} aria-current={isActive ? "page" : undefined} />}
                  tooltip={item.title}
                  className={`flex items-center gap-3 px-3 py-5 rounded-xl font-body-md text-sm font-semibold transition-all duration-200 group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!h-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center ${
                    isActive
                      ? "bg-[#F7A440] text-white shadow-sm hover:bg-[#e09132] hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? "fill" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100/50">
        <NavUser user={userData} />
        <div className="text-center mt-2 group-data-[collapsible=icon]:hidden">
          <p className="text-[9px] text-slate-400 font-medium">SIMPA HIPPA Cirengit &copy; 2026</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

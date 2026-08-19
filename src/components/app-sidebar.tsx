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


import { getCurrentRole, getStoredAcl } from "@/common/lib/mock-db"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

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

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
    { title: "Data Anggota", url: "/dashboard/data-anggota", icon: "database" },
    { title: "Tasykil", url: "/dashboard/tasykil", icon: "groups" },
    { title: "Calon Anggota", url: "/dashboard/calon-anggota", icon: "person_add" },
    { title: "Jadwal Kegiatan", url: "/dashboard/jadwal-kegiatan", icon: "calendar_month" },
    { title: "Role & Akses", url: "/dashboard/role-akses", icon: "admin_panel_settings" },
    { title: "Pengaturan", url: "/dashboard/pengaturan", icon: "settings" },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.url === "/dashboard/role-akses") {
      return currentRole === "Super Admin"; // Only Super Admin has access to ACL rules
    }
    if (!activeAcl) return true;
    if (item.url === "/dashboard") return activeAcl.permissions.dashboard;
    if (item.url === "/dashboard/data-anggota") return activeAcl.permissions.dataAnggota;
    if (item.url === "/dashboard/tasykil") return activeAcl.permissions.tasykil;
    if (item.url === "/dashboard/calon-anggota") return activeAcl.permissions.calonAnggota;
    if (item.url === "/dashboard/jadwal-kegiatan") return activeAcl.permissions.jadwalKegiatan;
    if (item.url === "/dashboard/pengaturan") return activeAcl.permissions.pengaturan;
    return true;
  });

  const getSubLabel = () => {
    if (currentRole === "Super Admin") return "Administrator";
    if (currentRole === "PIMHAR") return "Ketua Harian";
    if (currentRole === "Bidang") return "Pengurus Bidang";
    return "Anggota Biasa";
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-slate-100 p-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 overflow-hidden shadow-sm shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-cover rounded-full"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-bold text-slate-800">SIMPA HIPPA</span>
            <span className="truncate text-[10px] font-semibold text-[#F7A440] uppercase tracking-wide">{getSubLabel()}</span>
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
                  render={<Link href={item.url} />}
                  isActive={isActive}
                  tooltip={item.title}
                  className={`flex items-center gap-3 px-3 py-5 rounded-xl font-body-md text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#F7A440] text-white hover:bg-[#e09132] hover:text-white shadow-sm"
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

      <SidebarFooter className="p-4 border-t border-slate-50 text-center group-data-[collapsible=icon]:hidden">
        <p className="text-[9px] text-slate-400 font-medium">SIMPA HIPPA Cirengit &copy; 2026</p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

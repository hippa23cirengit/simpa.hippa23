"use client"

import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleLogout = () => {
    router.push("/login")
  }

  const handleProfile = () => {
    router.push("/dashboard/profil")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-slate-50/50 transition-all duration-200 text-left aria-expanded:bg-slate-50 aria-expanded:border-amber-200"
              />
            }
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-full border border-amber-200">
                <AvatarFallback className="bg-amber-500/10 text-[#895200] text-xs font-bold font-sans">
                  AF
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-slate-800 leading-snug">{user.name}</span>
                <span className="truncate text-[10px] text-slate-500 font-medium leading-none mt-0.5">{user.email}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px] ml-auto group-data-[collapsible=icon]:hidden">
              unfold_more
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-xl shadow-lg border border-slate-200/80 p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-left text-xs">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 rounded-full border border-amber-200">
                  <AvatarFallback className="bg-amber-500/10 text-[#895200] text-[10px] font-bold">
                    AF
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-[11px] leading-tight">
                  <span className="truncate font-bold text-slate-800">{user.name}</span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleProfile}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500">account_circle</span>
                Profil Lengkap
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

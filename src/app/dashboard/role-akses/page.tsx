"use client"

import * as React from "react"
import { getStoredAcl, saveStoredAcl, AclRule } from "@/common/lib/mock-db"

export default function RoleAksesPage() {
  const [aclList, setAclList] = React.useState<AclRule[]>([])
  const [isModified, setIsModified] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  React.useEffect(() => {
    setAclList(getStoredAcl())
  }, [])

  const handleToggle = (roleName: string, permissionKey: keyof AclRule["permissions"]) => {
    if (roleName === "Super Admin") return // Super Admin permissions are locked

    setAclList(prev => {
      const updated = prev.map(item => {
        if (item.role === roleName) {
          return {
            ...item,
            permissions: {
              ...item.permissions,
              [permissionKey]: !item.permissions[permissionKey]
            }
          }
        }
        return item
      })
      setIsModified(true)
      return updated
    })
  }

  const handleSave = () => {
    saveStoredAcl(aclList)
    setIsModified(false)
    setSaveSuccess(true)
    
    // Dispatch event to update sidebar & layouts
    window.dispatchEvent(new Event("simpa_role_changed"))

    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  const handleReset = () => {
    setAclList(getStoredAcl())
    setIsModified(false)
  }

  const pageLabels: { key: keyof AclRule["permissions"]; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard Utama", icon: "dashboard" },
    { key: "dataAnggota", label: "Data Anggota (Lihat & Kelola)", icon: "database" },
    { key: "tasykil", label: "Tasykil Pengurus", icon: "groups" },
    { key: "calonAnggota", label: "Calon Anggota (Registrasi)", icon: "person_add" },
    { key: "jadwalKegiatan", label: "Jadwal Kegiatan (Kalender)", icon: "calendar_month" },
    { key: "pengaturan", label: "Pengaturan WA Gateway", icon: "settings" },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Manajemen Hak Akses (ACL)</h2>
          <p className="font-body-md text-sm text-slate-500 mt-1">Atur perizinan akses halaman untuk setiap tingkatan kepengurusan Himpunan.</p>
        </div>

        <div className="flex items-center gap-3">
          {isModified && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-sm transition duration-200"
            >
              Batal
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isModified}
            className={`px-5 py-2.5 rounded-lg text-white font-bold text-sm flex items-center gap-2 transition duration-300 shadow-sm ${
              isModified
                ? "bg-[#F7A440] hover:bg-[#e09132] active:bg-[#c97e25]"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 animate-fadeIn">
          <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
          <p className="text-xs font-bold">Konfigurasi Hak Akses berhasil disimpan! Sidebar & perizinan disinkronkan.</p>
        </div>
      )}

      {/* Roles Panels Grid */}
      <div className="grid grid-cols-1 gap-6">
        {aclList.map((roleAcl) => {
          const isSuperAdmin = roleAcl.role === "Super Admin"

          return (
            <div
              key={roleAcl.role}
              className={`bg-white rounded-2xl border ${
                isSuperAdmin ? "border-amber-200 shadow-amber-500/5" : "border-slate-200/80"
              } shadow-sm overflow-hidden`}
            >
              {/* Role Header Section */}
              <div
                className={`px-6 py-4 flex items-center justify-between border-b ${
                  isSuperAdmin ? "bg-amber-500/5 border-amber-100" : "bg-slate-50/50 border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSuperAdmin ? "bg-[#F7A440]/10 text-[#F7A440]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isSuperAdmin ? "shield_person" : "badge"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-title-lg text-base font-bold text-slate-800 flex items-center gap-2">
                      {roleAcl.role}
                      {isSuperAdmin && (
                        <span className="text-[10px] bg-[#F7A440] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Kunci Akses
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isSuperAdmin
                        ? "Memiliki kontrol penuh tanpa batasan akses ke semua menu sistem."
                        : `Aturan perizinan bagi pengguna berstatus peran ${roleAcl.role}.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Permissions Switches Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageLabels.map((page) => {
                  const isChecked = roleAcl.permissions[page.key]
                  
                  return (
                    <div
                      key={page.key}
                      onClick={() => !isSuperAdmin && handleToggle(roleAcl.role, page.key)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isSuperAdmin
                          ? "bg-slate-50/60 border-slate-100 cursor-not-allowed"
                          : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-slate-400">
                          {page.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{page.label}</span>
                      </div>

                      {/* Custom Switch Toggle */}
                      <div
                        className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                          isChecked
                            ? isSuperAdmin
                              ? "bg-amber-400/80"
                              : "bg-[#F7A440]"
                            : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${
                            isChecked ? "transform translate-x-4" : ""
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import {
  getStoredAcl,
  saveStoredAcl,
  getStoredAccounts,
  saveStoredAccounts,
  getStoredMembers,
  getStoredTasykil,
  AclRule,
  LoginAccount,
  Member
} from "@/common/lib/mock-db"
import { customConfirm } from "@/common/lib/alert"

export default function RoleAksesPage() {
  const [aclList, setAclList] = React.useState<AclRule[]>([])
  const [accounts, setAccounts] = React.useState<LoginAccount[]>([])
  const [members, setMembers] = React.useState<Member[]>([])
  const [availableRoles, setAvailableRoles] = React.useState<string[]>([])
  
  const [expandedRoles, setExpandedRoles] = React.useState<Record<string, boolean>>({
    "Super Admin": true
  })

  const toggleExpandRole = (role: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }))
  }
  
  const [isModified, setIsModified] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  
  // User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [selectedMemberId, setSelectedMemberId] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState("Anggota")
  const [passwordInput, setPasswordInput] = React.useState("cirengit23")
  const [modalError, setModalError] = React.useState("")

  // Edit Role Modal State
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingNpa, setEditingNpa] = React.useState("")
  const [editingRole, setEditingRole] = React.useState("Anggota")

  const loadData = () => {
    const acl = getStoredAcl()
    setAclList(acl)
    
    const accs = getStoredAccounts()
    setAccounts(accs)
    
    const mems = getStoredMembers()
    setMembers(mems)
    
    // Resolve available roles from ACL roles
    const roles = acl.map(r => r.role)
    if (!roles.includes("Anggota")) roles.push("Anggota")
    setAvailableRoles(roles)
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const handleToggleView = (
    roleName: string,
    viewKey: keyof AclRule["permissions"],
    manageKey: keyof AclRule["permissions"] | null
  ) => {
    if (roleName === "Super Admin") return

    setAclList((prev) => {
      const updated = prev.map((item) => {
        if (item.role === roleName) {
          const newViewVal = !item.permissions[viewKey]
          const newManageVal = !newViewVal && manageKey ? false : item.permissions[manageKey as keyof AclRule["permissions"]]

          return {
            ...item,
            permissions: {
              ...item.permissions,
              [viewKey]: newViewVal,
              ...(manageKey ? { [manageKey]: newManageVal } : {})
            }
          }
        }
        return item
      })
      setIsModified(true)
      return updated
    })
  }

  const handleToggleManage = (
    roleName: string,
    manageKey: keyof AclRule["permissions"],
    viewKey: keyof AclRule["permissions"]
  ) => {
    if (roleName === "Super Admin") return

    setAclList((prev) => {
      const updated = prev.map((item) => {
        if (item.role === roleName) {
          const newManageVal = !item.permissions[manageKey]
          const newViewVal = newManageVal ? true : item.permissions[viewKey]

          return {
            ...item,
            permissions: {
              ...item.permissions,
              [manageKey]: newManageVal,
              [viewKey]: newViewVal
            }
          }
        }
        return item
      })
      setIsModified(true)
      return updated
    })
  }

  const handleSaveAcl = async () => {
    const confirmed = await customConfirm({
      title: "Simpan Perubahan Hak Akses",
      message: "Apakah Anda yakin ingin menyimpan perubahan hak akses ini? Perubahan akan langsung mempengaruhi izin menu dan tindakan dari role pengurus terkait.",
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    saveStoredAcl(aclList)
    setIsModified(false)
    setSaveSuccess(true)
    
    // Dispatch event to update sidebar & layouts
    window.dispatchEvent(new Event("simpa_role_changed"))

    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  const handleResetAcl = async () => {
    const confirmed = await customConfirm({
      title: "Batalkan Perubahan",
      message: "Apakah Anda yakin ingin membatalkan semua perubahan hak akses yang belum disimpan?",
      type: "warning",
      confirmText: "Ya, Batalkan",
      cancelText: "Kembali"
    })

    if (!confirmed) return

    setAclList(getStoredAcl())
    setIsModified(false)
  }

  // USER MANAGEMENT ACTIONS
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    setModalError("")

    if (!selectedMemberId) {
      setModalError("Pilih anggota terlebih dahulu.")
      return
    }

    const memberObj = members.find(m => m.id === selectedMemberId)
    if (!memberObj) return

    // Check if account already exists
    const exists = accounts.some(acc => acc.npa === selectedMemberId)
    if (exists) {
      setModalError("Anggota ini sudah memiliki akun login.")
      return
    }

    const newAccount: LoginAccount = {
      npa: memberObj.id,
      name: memberObj.name,
      role: selectedRole,
      passwordHash: passwordInput.trim() || "cirengit23",
      linkedAnggotaId: memberObj.id
    }

    const updated = [...accounts, newAccount]
    setAccounts(updated)
    saveStoredAccounts(updated)
    setIsAddModalOpen(false)
    
    // Reset state
    setSelectedMemberId("")
    setSelectedRole("Anggota")
    setPasswordInput("cirengit23")
  }

  const handleRemoveUser = (npa: string) => {
    if (npa === "26.0000") return // Prevent deleting Super Admin Najmi
    if (confirm(`Apakah Anda yakin ingin mencabut hak akses login untuk NPA ${npa}?`)) {
      const updated = accounts.filter(acc => acc.npa !== npa)
      setAccounts(updated)
      saveStoredAccounts(updated)
    }
  }

  const handleResetUserPassword = (npa: string, memberName: string) => {
    const newPass = prompt(`Masukkan password baru untuk ${memberName}:`, "cirengit23")
    if (newPass === null) return
    if (!newPass.trim()) {
      alert("Password tidak boleh kosong!")
      return
    }
    
    const updated = accounts.map(acc => {
      if (acc.npa === npa) {
        return { ...acc, passwordHash: newPass.trim() }
      }
      return acc
    })
    setAccounts(updated)
    saveStoredAccounts(updated)
    alert("Password berhasil di-reset!")
  }

  const openEditRoleModal = (account: LoginAccount) => {
    setEditingNpa(account.npa)
    setEditingRole(account.role)
    setIsEditModalOpen(true)
  }

  const handleSaveRoleEdit = () => {
    const updated = accounts.map(acc => {
      if (acc.npa === editingNpa) {
        return { ...acc, role: editingRole }
      }
      return acc
    })
    setAccounts(updated)
    saveStoredAccounts(updated)
    setIsEditModalOpen(false)
    
    // Notify window that role mapping changed
    window.dispatchEvent(new Event("simpa_role_changed"))
  }

  // Filter members who do not have accounts yet
  const membersWithoutAccounts = members.filter(
    m => !accounts.some(acc => acc.npa === m.id)
  )

  const featureMatrix = [
    {
      label: "Data Anggota",
      description: "Tambah, edit, dan hapus data anggota himpunan",
      icon: "database",
      viewKey: "viewDataAnggota" as keyof AclRule["permissions"],
      manageKey: "manageDataAnggota" as keyof AclRule["permissions"],
    },
    {
      label: "Struktur Tasykil",
      description: "Atur susunan dan penugasan kepengurusan",
      icon: "groups",
      viewKey: "viewTasykil" as keyof AclRule["permissions"],
      manageKey: "manageTasykil" as keyof AclRule["permissions"],
    },
    {
      label: "Calon Anggota",
      description: "Verifikasi dan ACC / Tolak pendaftar baru",
      icon: "how_to_reg",
      viewKey: "viewCalonAnggota" as keyof AclRule["permissions"],
      manageKey: "manageCalonAnggota" as keyof AclRule["permissions"],
    },
    {
      label: "Jadwal Kegiatan",
      description: "Tambah, edit, dan hapus agenda kalender",
      icon: "edit_calendar",
      viewKey: "viewJadwalKegiatan" as keyof AclRule["permissions"],
      manageKey: "manageJadwalKegiatan" as keyof AclRule["permissions"],
    },
    {
      label: "Pengaturan WA",
      description: "Konfigurasi API Gateway & template notifikasi",
      icon: "settings",
      viewKey: "viewPengaturan" as keyof AclRule["permissions"],
      manageKey: "managePengaturan" as keyof AclRule["permissions"],
    },
    {
      label: "Dashboard Utama",
      description: "Halaman ringkasan statistik HIPPA",
      icon: "dashboard",
      viewKey: "dashboard" as keyof AclRule["permissions"],
      manageKey: null,
    },
  ]

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-10">
      {/* SECTION 1: ACL PERMISSIONS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Manajemen Hak Akses (ACL)</h2>
            <p className="font-body-md text-sm text-slate-500 mt-1">Atur perizinan akses halaman (Lihat & Kelola) untuk setiap peran bidang dan kepengurusan Himpunan.</p>
          </div>

          <div className="flex items-center gap-3">
            {isModified && (
              <button
                onClick={handleResetAcl}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-sm transition duration-200"
              >
                Batal
              </button>
            )}
            <button
              onClick={handleSaveAcl}
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

        {saveSuccess && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 animate-fadeIn">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <p className="text-xs font-bold">Konfigurasi Hak Akses berhasil disimpan! Perizinan disinkronkan.</p>
          </div>
        )}

        {/* Roles Panels Grid */}
        <div className="grid grid-cols-1 gap-6">
          {aclList.filter(roleAcl => roleAcl.role !== "Anggota").map((roleAcl) => {
            const isSuperAdmin = roleAcl.role === "Super Admin"
            const isExpanded = !!expandedRoles[roleAcl.role]

            return (
              <div
                key={roleAcl.role}
                className={`bg-white rounded-2xl border ${
                  isSuperAdmin ? "border-amber-200 shadow-amber-500/5" : "border-slate-200/80"
                } shadow-sm overflow-hidden`}
              >
                {/* Role Header Section */}
                <div
                  onClick={() => toggleExpandRole(roleAcl.role)}
                  className={`px-6 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                    isSuperAdmin 
                      ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-100" 
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-100"
                  } ${isExpanded ? "border-b" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
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

                  {/* Toggle Indicator Arrow */}
                  <div className="text-slate-400 p-1 rounded-full hover:bg-slate-200/50 transition-colors">
                    <span 
                      className="material-symbols-outlined text-[20px] block transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>

                {/* Role Permissions Matrix Table (Collapsible) */}
                {isExpanded && (
                  <div className="overflow-x-auto animate-fadeIn">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4 w-[200px]">Fitur / Modul</th>
                          <th className="px-6 py-4">Deskripsi Fitur</th>
                          <th className="px-6 py-4 text-center w-[130px]">Kelola (CRUD)</th>
                          <th className="px-6 py-4 text-center w-[130px]">Hanya Lihat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {featureMatrix.map((feature) => {
                          const isViewChecked = roleAcl.permissions[feature.viewKey]
                          const isManageChecked = feature.manageKey ? roleAcl.permissions[feature.manageKey] : false

                          return (
                            <tr key={feature.label} className="hover:bg-slate-50/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                                    {feature.icon}
                                  </span>
                                  <span className="font-bold text-slate-800">{feature.label}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">{feature.description}</td>
                              <td className="px-6 py-4 text-center">
                                {feature.manageKey ? (
                                  <div className="flex justify-center">
                                    <div
                                      onClick={() => !isSuperAdmin && handleToggleManage(roleAcl.role, feature.manageKey!, feature.viewKey)}
                                      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                                        isSuperAdmin
                                          ? "bg-amber-400/80 cursor-not-allowed"
                                          : isManageChecked
                                            ? "bg-[#F7A440] cursor-pointer"
                                            : "bg-slate-200 cursor-pointer"
                                      }`}
                                    >
                                      <span
                                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${
                                          isSuperAdmin || isManageChecked ? "transform translate-x-4" : ""
                                        }`}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  <div
                                    onClick={() => !isSuperAdmin && handleToggleView(roleAcl.role, feature.viewKey, feature.manageKey)}
                                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                                      isSuperAdmin
                                        ? "bg-slate-400/80 cursor-not-allowed"
                                        : isViewChecked
                                          ? "bg-slate-700 cursor-pointer"
                                          : "bg-slate-200 cursor-pointer"
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${
                                        isSuperAdmin || isViewChecked ? "transform translate-x-4" : ""
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* SECTION 2: USER MANAGEMENT */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-lg text-2xl font-extrabold text-[#1A1A1A]">Daftar Pengguna Dashboard</h2>
            <p className="font-body-md text-sm text-slate-500 mt-1">Kelola akun anggota yang memiliki izin masuk ke sistem dashboard.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#1A1A1A] hover:bg-[#2C2C2C] active:bg-[#000] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition duration-200 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Tambah Akses
          </button>
        </div>

        {/* User Accounts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nama Pengguna</th>
                  <th className="px-6 py-4">NPA / Username</th>
                  <th className="px-6 py-4">Peran Sistem</th>
                  <th className="px-6 py-4">Tipe Akun</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {accounts.map((acc) => {
                  const isMainAdmin = acc.npa === "26.0000"
                  return (
                    <tr key={acc.npa} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{acc.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{acc.npa}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isMainAdmin
                            ? "bg-amber-100 text-amber-800"
                            : acc.role === "PIMHAR"
                              ? "bg-blue-100 text-blue-800"
                              : acc.role.startsWith("Bidang")
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-800"
                        }`}>
                          {acc.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {isMainAdmin ? (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">terminal</span>
                            Sistem
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">badge</span>
                            Anggota
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isMainAdmin ? (
                          <span className="text-[10px] text-slate-400 italic font-medium px-3">Terkunci</span>
                        ) : (
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => openEditRoleModal(acc)}
                              className="text-[#F7A440] hover:text-[#e09132] transition-colors"
                            >
                              Ubah Peran
                            </button>
                            <button
                              onClick={() => handleResetUserPassword(acc.npa, acc.name)}
                              className="text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              Reset Sandi
                            </button>
                            <button
                              onClick={() => handleRemoveUser(acc.npa)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD USER ACCESS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#F7A440]">person_add</span>
              Tambah Hak Akses Pengguna
            </h3>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Anggota</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#F7A440]"
                >
                  <option value="">-- Pilih Anggota --</option>
                  {membersWithoutAccounts.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
                {membersWithoutAccounts.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 italic">Semua anggota terdaftar sudah memiliki akun login.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Peran Sistem (ACL)</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#F7A440]"
                >
                  {availableRoles.filter(r => r !== "Super Admin").map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Password Awal</label>
                <input
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="cirengit23"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#F7A440]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setModalError("")
                  }}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={membersWithoutAccounts.length === 0}
                  className="px-4 py-2 text-xs font-bold bg-[#F7A440] hover:bg-[#e09132] text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  Tambah Akses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER ROLE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#F7A440]">shield</span>
              Ubah Peran Sistem
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NPA / Username</label>
                <input
                  type="text"
                  disabled
                  value={editingNpa}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Peran Sistem (ACL) Baru</label>
                <select
                  value={editingRole}
                  onChange={(e) => setEditingRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#F7A440]"
                >
                  {availableRoles.filter(r => r !== "Super Admin").map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoleEdit}
                  className="px-4 py-2 text-xs font-bold bg-[#F7A440] hover:bg-[#e09132] text-white rounded-xl shadow-md"
                >
                  Simpan Peran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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

export default function RoleAksesPage() {
  const [aclList, setAclList] = React.useState<AclRule[]>([])
  const [accounts, setAccounts] = React.useState<LoginAccount[]>([])
  const [members, setMembers] = React.useState<Member[]>([])
  const [availableRoles, setAvailableRoles] = React.useState<string[]>([])
  
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

  const handleToggle = (roleName: string, permissionKey: keyof AclRule["permissions"]) => {
    if (roleName === "Super Admin") return // Super Admin is locked

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

  const handleSaveAcl = () => {
    saveStoredAcl(aclList)
    setIsModified(false)
    setSaveSuccess(true)
    
    // Dispatch event to update sidebar & layouts
    window.dispatchEvent(new Event("simpa_role_changed"))

    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  const handleResetAcl = () => {
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

  const handleResetPassword = (npa: string) => {
    const newPass = prompt("Masukkan password baru untuk akun ini:", "cirengit23")
    if (newPass === null) return // Canceled
    if (!newPass.trim()) {
      alert("Password tidak boleh kosong.")
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

  const pageLabels: { key: keyof AclRule["permissions"]; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard Utama", icon: "dashboard" },
    { key: "viewDataAnggota", label: "Lihat Data Anggota", icon: "database" },
    { key: "manageDataAnggota", label: "Kelola/Edit Anggota", icon: "edit_square" },
    { key: "viewTasykil", label: "Lihat Bagan Tasykil", icon: "groups" },
    { key: "manageTasykil", label: "Kelola Struktur Tasykil", icon: "manage_accounts" },
    { key: "viewCalonAnggota", label: "Lihat Calon Anggota", icon: "person_search" },
    { key: "manageCalonAnggota", label: "Kelola (ACC/Tolak) Calon", icon: "how_to_reg" },
    { key: "viewJadwalKegiatan", label: "Lihat Jadwal Kegiatan", icon: "calendar_month" },
    { key: "manageJadwalKegiatan", label: "Kelola Jadwal/Kegiatan", icon: "edit_calendar" },
    { key: "viewPengaturan", label: "Lihat Pengaturan WA", icon: "settings" },
    { key: "managePengaturan", label: "Ubah Pengaturan WA", icon: "settings_suggest" },
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
                              onClick={() => handleResetPassword(acc.npa)}
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

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  getStoredMembers,
  getStoredTasykil,
  saveStoredTasykil,
  saveStoredMembers,
  syncRoles,
  Member,
  TasykilState,
  Bidang,
  getCurrentRole,
  getStoredAcl,
  getPeriodeJabatan,
  savePeriodeJabatan
} from "@/common/lib/mock-db"
import { getSessionUser } from "@/common/lib/auth"
import { customConfirm, showToast } from "@/common/lib/alert"

export default function Tasykil() {
  const [members, setMembers] = useState<Member[]>([])
  const [tasykil, setTasykil] = useState<TasykilState | null>(null)
  const [currentRole, setCurrentRole] = useState("Super Admin")
  
  const user = getSessionUser()
  const myNpa = user?.npa

  const [pimharModalOpen, setPimharModalOpen] = useState(false)
  const [selectedPimharRole, setSelectedPimharRole] = useState<string | null>(null)
  
  const [bidangModalOpen, setBidangModalOpen] = useState(false)
  const [selectedBidangId, setSelectedBidangId] = useState<string | null>(null)
  
  const [newBidangName, setNewBidangName] = useState("")

  const [addBidangModalOpen, setAddBidangModalOpen] = useState(false)
  
  const [addPenasehatModalOpen, setAddPenasehatModalOpen] = useState(false)
  const [newPenasehatName, setNewPenasehatName] = useState("")
  
  const [searchQuery, setSearchQuery] = useState("")
  
  const [periodeJabatan, setPeriodeJabatan] = useState("2026 - 2028")
  const [isPeriodeSaved, setIsPeriodeSaved] = useState(false)

  const loadData = () => {
    setMembers(getStoredMembers())
    setTasykil(getStoredTasykil())
    setCurrentRole(getCurrentRole())
    setPeriodeJabatan(getPeriodeJabatan())
  }

  // Load state on mount
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

  const handleSavePeriode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    const confirmed = await customConfirm({
      title: "Simpan Periode Jabatan",
      message: `Apakah Anda yakin ingin memperbarui periode jabatan kepengurusan menjadi "${periodeJabatan.trim()}"?`,
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    savePeriodeJabatan(periodeJabatan.trim())
    setIsPeriodeSaved(true)
    showToast({
      message: "Periode jabatan kepengurusan berhasil disimpan!",
      type: "success"
    })
    setTimeout(() => {
      setIsPeriodeSaved(false)
    }, 3000)
  }

  const activeAcl = getStoredAcl().find(r => r.role === currentRole)
  const isReadOnly = !activeAcl?.permissions.manageTasykil

  // Sync state helpers
  const updateTasykilState = (newTasykil: TasykilState) => {
    setTasykil(newTasykil)
    saveStoredTasykil(newTasykil)
    // Automatically update roles in members list
    const updatedMembers = syncRoles(members, newTasykil)
    setMembers(updatedMembers)
    saveStoredMembers(updatedMembers)
  }

  if (!tasykil) return <div className="p-8 text-center text-slate-500 font-medium">Memuat data...</div>

  // PIMHAR Roles definitions
  const pimharRoles = [
    { key: "ketua", label: "Ketua" },
    { key: "wakilKetua", label: "Wakil Ketua" },
    { key: "sekretaris", label: "Sekretaris" },
    { key: "wakilSekretaris", label: "Wakil Sekretaris" },
    { key: "bendahara", label: "Bendahara" },
    { key: "wakilBendahara", label: "Wakil Bendahara" }
  ]

  // Get member details helper
  const getMemberById = (id: string) => members.find(m => m.id === id)

  // Find members who DO NOT hold any role
  const getAvailableMembers = () => {
    // Collect all assigned IDs
    const assignedIds = new Set<string>()
    Object.values(tasykil.pimhar).forEach(id => { if (id) assignedIds.add(id) })
    tasykil.bidang.forEach(b => {
      b.members.forEach(id => assignedIds.add(id))
    })
    return members.filter(m => !assignedIds.has(m.id) && m.id !== "26.0000")
  }

  // Handle assigning PIMHAR role
  const handleAssignPimhar = async (roleKey: string, memberId: string) => {
    if (!tasykil) return
    const member = getMemberById(memberId)
    const memberName = member ? member.name : "Anggota"
    const roleLabel = pimharRoles.find(r => r.key === roleKey)?.label || roleKey

    const oldMemberId = tasykil.pimhar[roleKey as keyof typeof tasykil.pimhar]
    let msg = `Apakah Anda yakin ingin menetapkan ${memberName} sebagai ${roleLabel}?`
    
    if (oldMemberId && oldMemberId !== memberId) {
      const oldMember = getMemberById(oldMemberId)
      const oldMemberName = oldMember ? oldMember.name : "pejabat sebelumnya"
      msg = `Apakah Anda yakin ingin mengganti ${oldMemberName} dengan ${memberName} sebagai ${roleLabel}?`
    }

    const confirmed = await customConfirm({
      title: "Tetapkan Jabatan Tasykil",
      message: msg,
      type: "warning",
      confirmText: "Ya, Tetapkan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const updated = {
      ...tasykil,
      pimhar: {
        ...tasykil.pimhar,
        [roleKey]: memberId
      }
    }
    updateTasykilState(updated)
    setPimharModalOpen(false)
    setSelectedPimharRole(null)
    showToast({
      message: `Berhasil menetapkan ${memberName} sebagai ${roleLabel}!`,
      type: "success"
    })
  }

  // Handle removing PIMHAR role
  const handleRemovePimhar = async (roleKey: string) => {
    if (!tasykil) return
    const memberId = tasykil.pimhar[roleKey as keyof typeof tasykil.pimhar]
    if (!memberId) return
    const member = getMemberById(memberId)
    const roleLabel = pimharRoles.find(r => r.key === roleKey)?.label || roleKey
    const memberName = member ? member.name : "Anggota"

    const confirmed = await customConfirm({
      title: "Hapus Pengurus PIMHAR",
      message: `Apakah Anda yakin ingin menghapus ${memberName} dari jabatan ${roleLabel}?`,
      type: "warning",
      confirmText: "Ya, Hapus",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const updated = {
      ...tasykil,
      pimhar: {
        ...tasykil.pimhar,
        [roleKey]: ""
      }
    }
    updateTasykilState(updated)
    showToast({
      message: `Berhasil mencopot jabatan ${roleLabel}!`,
      type: "success"
    })
  }

  // Handle adding Penasehat
  const handleAddPenasehat = async () => {
    if (!newPenasehatName.trim() || !tasykil) return
    const name = newPenasehatName.trim()

    const confirmed = await customConfirm({
      title: "Tambah Penasehat",
      message: `Apakah Anda yakin ingin menambahkan ${name} ke jajaran Penasehat?`,
      type: "warning",
      confirmText: "Ya, Tambah",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const updated = {
      ...tasykil,
      penasehat: [...tasykil.penasehat, name]
    }
    updateTasykilState(updated)
    setNewPenasehatName("")
    setAddPenasehatModalOpen(false)
    showToast({
      message: `Berhasil menambahkan ${name} sebagai Penasehat!`,
      type: "success"
    })
  }

  // Handle removing Penasehat
  const handleRemovePenasehat = async (index: number) => {
    if (!tasykil) return
    const name = tasykil.penasehat[index]
    
    const confirmed = await customConfirm({
      title: "Hapus Penasehat",
      message: `Apakah Anda yakin ingin menghapus ${name} dari jajaran Penasehat?`,
      type: "warning",
      confirmText: "Ya, Hapus",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const updated = {
      ...tasykil,
      penasehat: tasykil.penasehat.filter((_, idx) => idx !== index)
    }
    updateTasykilState(updated)
    showToast({
      message: `Penasehat "${name}" berhasil dihapus!`,
      type: "success"
    })
  }

  // Handle adding new Bidang
  const handleAddBidang = async () => {
    if (!newBidangName.trim()) return
    const name = newBidangName.trim()

    const confirmed = await customConfirm({
      title: "Tambah Bidang Baru",
      message: `Apakah Anda yakin ingin membuat bidang baru "${name}"?`,
      type: "warning",
      confirmText: "Ya, Buat",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const id = `bidang-${Date.now()}`
    const updated = {
      ...tasykil,
      bidang: [
        ...tasykil.bidang,
        { id, name, members: [] }
      ]
    }
    updateTasykilState(updated)
    setNewBidangName("")
    setAddBidangModalOpen(false)
    showToast({
      message: `Bidang kepengurusan "${name}" berhasil dibuat!`,
      type: "success"
    })
  }

  // Handle deleting a Bidang
  const handleDeleteBidang = async (bidangId: string) => {
    if (!tasykil) return
    const bidang = tasykil.bidang.find(b => b.id === bidangId)
    const name = bidang ? bidang.name : "Bidang"

    const confirmed = await customConfirm({
      title: "Hapus Bidang Kepengurusan",
      message: `Apakah Anda yakin ingin menghapus ${name} secara permanen? Semua anggota di bidang ini akan kehilangan jabatannya.`,
      type: "warning",
      confirmText: "Ya, Hapus",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const updated = {
      ...tasykil,
      bidang: tasykil.bidang.filter(b => b.id !== bidangId)
    }
    updateTasykilState(updated)
    showToast({
      message: `Bidang kepengurusan "${name}" berhasil dihapus!`,
      type: "success"
    })
  }

  // Handle multi-choice select members for a Bidang
  const handleUpdateBidangMembers = async (bidangId: string, memberIds: string[]) => {
    if (!tasykil) return
    const bidang = tasykil.bidang.find(b => b.id === bidangId)
    const name = bidang ? bidang.name : "Bidang"

    const confirmed = await customConfirm({
      title: "Perbarui Anggota Bidang",
      message: `Apakah Anda yakin ingin memperbarui daftar anggota untuk bidang ${name}?`,
      type: "warning",
      confirmText: "Ya, Simpan",
      cancelText: "Batal"
    })

    if (!confirmed) return

    const updated = {
      ...tasykil,
      bidang: tasykil.bidang.map(b => 
        b.id === bidangId ? { ...b, members: memberIds } : b
      )
    }
    updateTasykilState(updated)
    showToast({
      message: `Anggota bidang "${name}" berhasil diperbarui!`,
      type: "success"
    })
  }

  // Get list of members currently assigned to a specific bidang
  const getBidangMembers = (bidangId: string) => {
    const b = tasykil.bidang.find(x => x.id === bidangId)
    if (!b) return []
    return b.members.map(id => getMemberById(id)).filter((m): m is Member => !!m)
  }

  // Unassigned members (Table 3) sorted A-Z
  const unassignedMembers = getAvailableMembers().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#1A1A1A] leading-tight">Tasykil Pengurus</h2>
        <p className="font-body-md text-sm text-slate-500 mt-1">Kelola pembagian penugasan, penasehat, serta departemen bidang organisasi.</p>
      </div>

      {/* Pengaturan Periode Kepengurusan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-title-lg text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F7A440]">calendar_month</span>
            Pengaturan Periode Kepengurusan
          </h3>
          {isPeriodeSaved && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-fadeIn">
              Periode Disimpan!
            </span>
          )}
        </div>
        <form onSubmit={handleSavePeriode} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Periode Jabatan Tasykil
            </label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              value={periodeJabatan}
              onChange={(e) => setPeriodeJabatan(e.target.value)}
              placeholder="Contoh: 2026 - 2028"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 font-body-md text-sm text-slate-800 focus:outline-none focus:border-[#F7A440] disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          {!isReadOnly && (
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2C2C2C] active:bg-[#000] text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm shrink-0"
            >
              Simpan Periode
            </button>
          )}
        </form>
      </div>

      {/* ======================= TABEL 1: DEWAN PENASEHAT ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-500 text-[22px]">verified_user</span>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Dewan Penasehat</h3>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setAddPenasehatModalOpen(true)}
              className="bg-[#F7A440] hover:bg-[#e09132] text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition text-xs shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Tambah Penasehat
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="py-3 px-4 w-28 md:w-40">Jabatan</th>
                  <th className="py-3 px-4">Nama Penasehat</th>
                  {!isReadOnly && <th className="py-3 px-4 w-20 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tasykil.penasehat.length > 0 ? (
                  tasykil.penasehat.map((name, index) => (
                    <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-700">Penasehat</td>
                      <td className="py-3.5 px-4 text-xs text-slate-800 font-bold break-words max-w-[180px] sm:max-w-none">
                        {name}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleRemovePenasehat(index)}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px] transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-700">Penasehat</td>
                    <td className="py-4 px-4 text-slate-400 font-semibold italic" colSpan={!isReadOnly ? 2 : 1}>
                      Belum memiliki penasehat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================= TABEL 2: PIMPINAN HARIAN (PIMHAR) ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-500 text-[22px]">verified_user</span>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Pimpinan Harian (PIMHAR)</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="py-3 px-4 w-48">Jabatan</th>
                  <th className="py-3 px-4">Nama Pengurus</th>
                  {!isReadOnly && <th className="py-3 px-4 w-28 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pimharRoles.map((role) => {
                  const assigneeId = tasykil.pimhar[role.key as keyof typeof tasykil.pimhar]
                  const assignee = assigneeId ? getMemberById(assigneeId) : null

                  return (
                    <tr key={role.key} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-700">{role.label}</td>
                      <td className="py-3.5 px-4">
                        {assignee ? (
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-[#895200] border border-amber-200 flex items-center justify-center font-bold text-[10px]">
                              {assignee.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-800 text-xs">{assignee.name}</span>
                              <span className="text-[10px] text-slate-500 font-medium font-mono">NPA: {assignee.id}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold italic">Belum diisi</span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          {assignee ? (
                            <div className="flex items-center justify-center gap-2">
                              {assigneeId === myNpa ? (
                                <span className="text-slate-400 font-bold text-[10px] italic">Sesi Anda</span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { setSelectedPimharRole(role.key); setPimharModalOpen(true); }}
                                    className="text-[#F7A440] hover:text-[#e09132] font-bold text-[11px] transition-colors"
                                  >
                                    Ganti
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    onClick={() => handleRemovePimhar(role.key)}
                                    className="text-red-500 hover:text-red-700 font-bold text-[11px] transition-colors"
                                  >
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => { setSelectedPimharRole(role.key); setPimharModalOpen(true); }}
                              className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-sm transition"
                            >
                              + Pilih Anggota
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================= TABEL 2: BIDANG-BIDANG ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-purple-500 text-[22px]">corporate_fare</span>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Pembagian Bidang / Departemen</h3>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setAddBidangModalOpen(true)}
              className="bg-[#F7A440] hover:bg-[#e09132] text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition text-xs shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Tambah Bidang
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="py-3 px-4 w-60">Nama Bidang</th>
                  <th className="py-3 px-4">Nama Pengurus</th>
                  <th className="py-3 px-4 w-48">NPA</th>
                  {!isReadOnly && <th className="py-3 px-4 w-28 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tasykil.bidang.map((b) => {
                  const assignedMembers = getBidangMembers(b.id)

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-700">{b.name}</td>
                      <td className="py-4 px-4">
                        {assignedMembers.length > 0 ? (
                          <div className="flex flex-col gap-1.5 py-1">
                            {assignedMembers.map(m => (
                              <div key={m.id} className="text-xs text-slate-800 font-bold h-5 flex items-center">
                                {m.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold italic">Belum memiliki anggota</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {assignedMembers.length > 0 ? (
                          <div className="flex flex-col gap-1.5 py-1">
                            {assignedMembers.map(m => (
                              <div key={m.id} className="text-[10px] text-slate-500 font-medium font-mono h-5 flex items-center">
                                {m.id}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono italic">-</span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setSelectedBidangId(b.id); setBidangModalOpen(true); }}
                              className="text-[#F7A440] hover:text-[#e09132] font-bold text-[11px] transition-colors"
                            >
                              + Anggota
                            </button>
                            <span className="text-slate-300">|</span>
                            {b.members.includes(myNpa || "") ? (
                              <span className="text-slate-400 font-bold text-[10px] italic" title="Anda berada di bidang ini">Sesi Anda</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteBidang(b.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-[11px] transition-colors"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {tasykil.bidang.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-slate-400 italic">
                      Belum ada bidang kepengurusan. Tambah bidang pertama Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================= TABEL 3: ANGGOTA (TANPA JABATAN) ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-slate-500 text-[22px]">groups</span>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Daftar Anggota</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="py-3 px-4 w-16 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4 w-48">NPA</th>
                  <th className="py-3 px-4 w-32">Status Keanggotaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {unassignedMembers.map((m, index) => (
                  <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{m.name}</td>
                    <td className="py-3 px-4 font-mono">{m.id}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "Aktif" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {unassignedMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-slate-400 italic">
                      Seluruh anggota aktif sudah didelegasikan peran jabatan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* ======================================== MODALS ======================================== */}
      {/* ========================================================================================= */}

      {/* 1. Modal: Assign PIMHAR Member */}
      {pimharModalOpen && selectedPimharRole && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Pilih Anggota: {pimharRoles.find(r => r.key === selectedPimharRole)?.label}
              </h3>
              <button
                onClick={() => { setPimharModalOpen(false); setSelectedPimharRole(null); setSearchQuery(""); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#F7A440] bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 max-h-[350px]">
              {getAvailableMembers()
                .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleAssignPimhar(selectedPimharRole, m.id)}
                    className="w-full text-left py-3 px-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-800 group-hover:text-[#F7A440] transition-colors">{m.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{m.id}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-[#F7A440] text-[16px] transition-colors">
                      add_circle
                    </span>
                  </button>
                ))}
              {getAvailableMembers().filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400 italic">Anggota tidak ditemukan / seluruhnya sudah memiliki peran.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Assign Bidang Members (Multiple Choice) */}
      {bidangModalOpen && selectedBidangId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Pilih Anggota: {tasykil.bidang.find(b => b.id === selectedBidangId)?.name}
              </h3>
              <button
                onClick={() => { setBidangModalOpen(false); setSelectedBidangId(null); setSearchQuery(""); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#F7A440] bg-white"
                />
              </div>
            </div>

            {/* List of members to check/uncheck */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 max-h-[350px]">
              {members
                .filter(m => {
                  // Hide Super Admin
                  if (m.id === "26.0000") return false

                  // Hide members already assigned to PIMHAR
                  const assignedPimharIds = new Set(Object.values(tasykil.pimhar).filter(id => !!id))
                  if (assignedPimharIds.has(m.id)) return false
                  
                  // Hide members in other bidang
                  const otherBidangMembers = new Set<string>()
                  tasykil.bidang.forEach(b => {
                    if (b.id !== selectedBidangId) {
                      b.members.forEach(id => otherBidangMembers.add(id))
                    }
                  })
                  if (otherBidangMembers.has(m.id)) return false

                  return m.name.toLowerCase().includes(searchQuery.toLowerCase())
                })
                .map(m => {
                  const targetBidang = tasykil.bidang.find(b => b.id === selectedBidangId)
                  const isChecked = targetBidang ? targetBidang.members.includes(m.id) : false

                  const handleCheckboxChange = () => {
                    if (!targetBidang) return
                    const currentMembers = targetBidang.members
                    const nextMembers = isChecked
                      ? currentMembers.filter(id => id !== m.id)
                      : [...currentMembers, m.id]
                    handleUpdateBidangMembers(selectedBidangId, nextMembers)
                  }

                  return (
                    <label
                      key={m.id}
                      className={`w-full flex items-center justify-between py-3 px-2 rounded-lg transition select-none ${m.id === myNpa ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-slate-50 cursor-pointer"}`}
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800">{m.name} {m.id === myNpa && "(Anda)"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{m.id}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={m.id === myNpa}
                        onChange={m.id === myNpa ? undefined : handleCheckboxChange}
                        className="w-4 h-4 rounded text-[#F7A440] border-slate-300 focus:ring-[#F7A440] disabled:opacity-50"
                      />
                    </label>
                  )
                })}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => { setBidangModalOpen(false); setSelectedBidangId(null); setSearchQuery(""); }}
                className="bg-[#F7A440] hover:bg-[#e09132] text-white font-bold px-5 py-2 rounded-lg text-xs shadow-sm transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add New Bidang */}
      {addBidangModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tambah Bidang Baru</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Masukkan nama divisi bidang kepengurusan baru.</p>
            </div>
            <input
              type="text"
              placeholder="Contoh: Bidang Publikasi & Dakwah"
              value={newBidangName}
              onChange={(e) => setNewBidangName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#F7A440] focus:ring-1 focus:ring-[#f7a440]"
            />
            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                onClick={() => { setAddBidangModalOpen(false); setNewBidangName(""); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleAddBidang}
                className="px-4 py-2 bg-[#F7A440] hover:bg-[#e09132] text-white rounded-lg shadow-sm transition"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 4. Modal: Add New Penasehat */}
      {addPenasehatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tambah Penasehat Baru</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Masukkan nama dewan penasehat baru (kustom).</p>
            </div>
            <input
              type="text"
              placeholder="Contoh: Ust. KH. Aceng Zakaria"
              value={newPenasehatName}
              onChange={(e) => setNewPenasehatName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#F7A440] focus:ring-1 focus:ring-[#f7a440]"
            />
            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                onClick={() => { setAddPenasehatModalOpen(false); setNewPenasehatName(""); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleAddPenasehat}
                className="px-4 py-2 bg-[#F7A440] hover:bg-[#e09132] text-white rounded-lg shadow-sm transition"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

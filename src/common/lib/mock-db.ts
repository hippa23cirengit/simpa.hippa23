export interface Member {
  id: string;
  name: string;
  role: string; // e.g. "Ketua", "Sekretaris", "Bendahara", "Bidang Publikasi", or "-"
  status: "Aktif" | "Tidak Aktif" | "Alumni";
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string; // Digunakan sebagai Alamat Lengkap/Nama Jalan
  rtRw?: string;
  kelDesa?: string;
  kecamatan?: string;
  kabKota?: string;
  pekerjaan?: string;
  whatsapp?: string;
  email?: string;
  profilePhoto?: string;
  bergabungTahun?: string;
  createdAt?: string;
}

export interface Bidang {
  id: string;
  name: string;
  members: string[]; // array of member IDs
}

export interface TasykilState {
  penasehat: string[]; // custom free text names
  pimhar: {
    ketua: string; // member.id
    wakilKetua: string; // member.id
    sekretaris: string; // member.id
    wakilSekretaris: string; // member.id
    bendahara: string; // member.id
    wakilBendahara: string; // member.id
  };
  bidang: Bidang[];
}

export interface ScheduledEvent {
  id: string;
  title: string;
  date: string; // format YYYY-MM-DD
  time: string; // format HH:mm
  location: string;
  color: string; // Tailwind representation e.g. "blue", "amber", "emerald", "purple", "red"
  type?: "kajian" | "umum"; // Tipe kegiatan
  speaker?: string;        // Nama pemateri (opsional)
  theme?: string;          // Tema kajian (opsional)
  notificationCount?: number; // Jumlah notifikasi terkirim (maks 2)
}

export interface AclRule {
  role: string;
  permissions: {
    dashboard: boolean;
    viewDataAnggota: boolean;
    manageDataAnggota: boolean;
    viewTasykil: boolean;
    manageTasykil: boolean;
    viewCalonAnggota: boolean;
    manageCalonAnggota: boolean;
    viewJadwalKegiatan: boolean;
    manageJadwalKegiatan: boolean;
    viewPengaturanSistem: boolean;
    managePengaturanSistem: boolean;
    viewPengaturanWa: boolean;
    managePengaturanWa: boolean;
    viewKeuangan: boolean;
    manageKeuangan: boolean;
  };
}

export interface KopSuratConfig {
  logoKiriUrl: string;
  logoKananUrl: string;
  namaOrganisasi: string;
  namaInstansi: string;
  alamat: string;
}

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: "26.0000",
    name: "Najmi Shofwan Al-Azhar",
    role: "Super Admin",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2001-04-12",
    alamat: "Bandung",
    pekerjaan: "Super Admin",
    whatsapp: "0812-3456-7890",
    email: "najmi.alazhar@gmail.com"
  }
]

export const DEFAULT_TASYKIL: TasykilState = {
  penasehat: [],
  pimhar: {
    ketua: "",
    wakilKetua: "",
    sekretaris: "",
    wakilSekretaris: "",
    bendahara: "",
    wakilBendahara: ""
  },
  bidang: [
    { id: "bidang-kaderisasi", name: "Bidang Kaderisasi", members: [] },
    { id: "bidang-pendidikan", name: "Bidang Pendidikan", members: [] },
    { id: "bidang-organisasi", name: "Bidang Organisasi", members: [] },
    { id: "bidang-sosial", name: "Bidang Sosial", members: [] }
  ]
}

const MEMBERS_KEY = "simpa_members_state"
const TASYKIL_KEY = "simpa_tasykil"
const KTA_SETTINGS_KEY = "simpa_kta_settings"

export interface KtaSettings {
  ketuaName: string;
  ketuaNpa: string;
  signatureUrl: string;
}

export const DEFAULT_KTA_SETTINGS: KtaSettings = {
  ketuaName: "Nama Ketua",
  ketuaNpa: "00.0000",
  signatureUrl: ""
}

export function getStoredKtaSettings(): KtaSettings {
  if (typeof window === "undefined") return DEFAULT_KTA_SETTINGS;
  const data = localStorage.getItem(KTA_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_KTA_SETTINGS;
}

export function saveStoredKtaSettings(settings: KtaSettings) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KTA_SETTINGS_KEY, JSON.stringify(settings))
    syncToServer(KTA_SETTINGS_KEY, settings)
  }
}

export function generateNextNpa(members: Member[], year: number = new Date().getFullYear()): string {
  const year2Digits = String(year).slice(-2)
  const thisYearPrefix = `${year2Digits}.`
  const yearMembers = members.filter(m => m.id.startsWith(thisYearPrefix))
  
  let nextSeq = 1
  if (yearMembers.length > 0) {
    const seqs = yearMembers.map(m => {
      const parts = m.id.split(".")
      return parts.length > 1 ? parseInt(parts[1], 10) : 0
    })
    nextSeq = Math.max(...seqs) + 1
  }
  
  const seq = String(nextSeq).padStart(4, "0")
  return `${year2Digits}.${seq}`
}

// Backend sync helper
function syncToServer(key: string, value: any): Promise<void> {
  if (typeof window !== "undefined") {
    // Notify UI that a sync has started
    window.dispatchEvent(new CustomEvent("simpa_sync_status", { detail: { status: "syncing" } }));

    return fetch("/api/db-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(`HTTP error! status: ${res.status} - ${errData.error || 'Unknown server error'}`);
      }
      const data = await res.json();
      if (data.status) {
        window.dispatchEvent(new CustomEvent("simpa_sync_status", { detail: { status: "success" } }));
      } else {
        window.dispatchEvent(new CustomEvent("simpa_sync_status", { detail: { status: "error", error: data.reason || "Gagal menyimpan ke database." } }));
      }
    })
    .catch(e => {
      console.error("Gagal sinkronisasi data ke server:", e);
      window.dispatchEvent(new CustomEvent("simpa_sync_status", { detail: { status: "error", error: e.message || "Gagal menghubungi server." } }));
    });
  }
  return Promise.resolve();
}

export async function syncDatabaseFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const res = await fetch("/api/db-sync")
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const resData = await res.json()
    if (resData.status && resData.data) {
      const data = resData.data
      Object.keys(data).forEach(key => {
        const valStr = typeof data[key] === "string" ? data[key] : JSON.stringify(data[key])
        localStorage.setItem(key, valStr)
      })
      // Dispatch event to sync UI
      window.dispatchEvent(new Event("simpa_role_changed"))
      return true
    }
    return false
  } catch (e) {
    console.error("Gagal sinkronisasi data dari server:", e)
    return false
  }
}

export function getStoredMembers(): Member[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS
  const stored = localStorage.getItem(MEMBERS_KEY)
  if (!stored) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS))
    return DEFAULT_MEMBERS
  }
  try {
    const parsed = JSON.parse(stored) as Member[]
    // Migration: Reset only if not an array or doesn't contain Najmi
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.some(m => m.id === "26.0000")) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS))
      localStorage.setItem(TASYKIL_KEY, JSON.stringify(DEFAULT_TASYKIL))
      return DEFAULT_MEMBERS
    }
    return parsed
  } catch (e) {
    return DEFAULT_MEMBERS
  }
}

export function saveStoredMembers(members: Member[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    syncToServer(MEMBERS_KEY, members)
  }
}

export function getStoredTasykil(): TasykilState {
  if (typeof window === "undefined") return DEFAULT_TASYKIL;
  const stored = localStorage.getItem(TASYKIL_KEY);
  if (!stored) {
    localStorage.setItem(TASYKIL_KEY, JSON.stringify(DEFAULT_TASYKIL));
    return DEFAULT_TASYKIL;
  }
  try {
    const parsed = JSON.parse(stored);
    // Migration check: if legacy penasehat is a string, wrap it in an array!
    if (typeof parsed.penasehat === "string") {
      parsed.penasehat = parsed.penasehat ? [parsed.penasehat] : [];
      localStorage.setItem(TASYKIL_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return DEFAULT_TASYKIL;
  }
}


export function syncRoles(members: Member[], tasykil: TasykilState): Member[] {
  return members.map(m => {
    if (m.id === "26.0000") return { ...m, role: "Super Admin" };
    if (tasykil.pimhar.ketua === m.id) return { ...m, role: "Ketua" };
    if (tasykil.pimhar.wakilKetua === m.id) return { ...m, role: "Wakil Ketua" };
    if (tasykil.pimhar.sekretaris === m.id) return { ...m, role: "Sekretaris" };
    if (tasykil.pimhar.wakilSekretaris === m.id) return { ...m, role: "Wakil Sekretaris" };
    if (tasykil.pimhar.bendahara === m.id) return { ...m, role: "Bendahara" };
    if (tasykil.pimhar.wakilBendahara === m.id) return { ...m, role: "Wakil Bendahara" };

    for (const b of tasykil.bidang) {
      if (b.members.includes(m.id)) {
        return { ...m, role: b.name };
      }
    }

    return { ...m, role: "-" };
  });
}

const EVENTS_KEY = "simpa_scheduled_events";
const ACL_KEY = "simpa_acl_rules";
const CURRENT_ROLE_KEY = "simpa_current_role";
const WA_TEMPLATE_KEY = "simpa_wa_template";

export const DEFAULT_EVENTS: ScheduledEvent[] = [];

export const DEFAULT_ACL: AclRule[] = [
  {
    role: "Super Admin",
    permissions: {
      dashboard: true,
      viewDataAnggota: true,
      manageDataAnggota: true,
      viewTasykil: true,
      manageTasykil: true,
      viewCalonAnggota: true,
      manageCalonAnggota: true,
      viewJadwalKegiatan: true,
      manageJadwalKegiatan: true,
      viewPengaturanSistem: true,
      managePengaturanSistem: true,
      viewPengaturanWa: true,
      managePengaturanWa: true,
      viewKeuangan: true,
      manageKeuangan: true
    }
  },
  {
    role: "Ketua",
    permissions: {
      dashboard: true,
      viewDataAnggota: true,
      manageDataAnggota: true,
      viewTasykil: true,
      manageTasykil: true,
      viewCalonAnggota: true,
      manageCalonAnggota: true,
      viewJadwalKegiatan: true,
      manageJadwalKegiatan: true,
      viewPengaturanSistem: false,
      managePengaturanSistem: false,
      viewPengaturanWa: false,
      managePengaturanWa: false,
      viewKeuangan: true,
      manageKeuangan: true
    }
  },
  {
    role: "Wakil Ketua",
    permissions: { dashboard: true, viewDataAnggota: true, manageDataAnggota: true, viewTasykil: true, manageTasykil: true, viewCalonAnggota: true, manageCalonAnggota: true, viewJadwalKegiatan: true, manageJadwalKegiatan: true, viewPengaturanSistem: false, managePengaturanSistem: false, viewPengaturanWa: false, managePengaturanWa: false, viewKeuangan: true, manageKeuangan: true }
  },
  {
    role: "Sekretaris",
    permissions: { dashboard: true, viewDataAnggota: true, manageDataAnggota: true, viewTasykil: true, manageTasykil: true, viewCalonAnggota: true, manageCalonAnggota: true, viewJadwalKegiatan: true, manageJadwalKegiatan: true, viewPengaturanSistem: false, managePengaturanSistem: false, viewPengaturanWa: false, managePengaturanWa: false, viewKeuangan: true, manageKeuangan: true }
  },
  {
    role: "Wakil Sekretaris",
    permissions: { dashboard: true, viewDataAnggota: true, manageDataAnggota: true, viewTasykil: true, manageTasykil: true, viewCalonAnggota: true, manageCalonAnggota: true, viewJadwalKegiatan: true, manageJadwalKegiatan: true, viewPengaturanSistem: false, managePengaturanSistem: false, viewPengaturanWa: false, managePengaturanWa: false, viewKeuangan: true, manageKeuangan: true }
  },
  {
    role: "Bendahara",
    permissions: { dashboard: true, viewDataAnggota: true, manageDataAnggota: true, viewTasykil: true, manageTasykil: true, viewCalonAnggota: true, manageCalonAnggota: true, viewJadwalKegiatan: true, manageJadwalKegiatan: true, viewPengaturanSistem: false, managePengaturanSistem: false, viewPengaturanWa: false, managePengaturanWa: false, viewKeuangan: true, manageKeuangan: true }
  },
  {
    role: "Wakil Bendahara",
    permissions: { dashboard: true, viewDataAnggota: true, manageDataAnggota: true, viewTasykil: true, manageTasykil: true, viewCalonAnggota: true, manageCalonAnggota: true, viewJadwalKegiatan: true, manageJadwalKegiatan: true, viewPengaturanSistem: false, managePengaturanSistem: false, viewPengaturanWa: false, managePengaturanWa: false, viewKeuangan: true, manageKeuangan: true }
  },
  {
    role: "Anggota",
    permissions: {
      dashboard: true,
      viewDataAnggota: true,
      manageDataAnggota: false,
      viewTasykil: true,
      manageTasykil: false,
      viewCalonAnggota: true,
      manageCalonAnggota: false,
      viewJadwalKegiatan: true,
      manageJadwalKegiatan: false,
      viewPengaturanSistem: false,
      managePengaturanSistem: false,
      viewPengaturanWa: false,
      managePengaturanWa: false,
      viewKeuangan: true,
      manageKeuangan: false
    }
  }
];

export const DEFAULT_WA_TEMPLATE = `Assalamu'alaikum Wr. Wb. Rekan *{{NAMA}}*, mengingatkan hari ini ada agenda HIPPA Cirengit:

📌 *Kegiatan*: {{KEGIATAN}}
⏰ *Waktu*: {{JAM}} WIB
📍 *Tempat*: {{LOKASI}}

Kehadiran rekan-rekan sangat dinantikan. Terima kasih.
_SIMPA HIPPA Cirengit_`;

export function getStoredEvents(): ScheduledEvent[] {
  if (typeof window === "undefined") return DEFAULT_EVENTS;
  const stored = localStorage.getItem(EVENTS_KEY);
  if (!stored) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS));
    return DEFAULT_EVENTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_EVENTS;
  }
}

export function saveStoredEvents(events: ScheduledEvent[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    syncToServer(EVENTS_KEY, events)
  }
}

export function getStoredAcl(): AclRule[] {
  if (typeof window === "undefined") return DEFAULT_ACL;
  const stored = localStorage.getItem(ACL_KEY);
  let parsed: AclRule[] = [];
  let changed = false;
  if (!stored) {
    parsed = [...DEFAULT_ACL];
    changed = true;
  } else {
    try {
      parsed = JSON.parse(stored);
      // Migration: Reset if legacy structure (missing granular permission keys)
      if (parsed.length > 0 && !parsed[0].permissions.hasOwnProperty("viewDataAnggota")) {
        parsed = [...DEFAULT_ACL];
        changed = true;
      }
      
      // Migration: Remove legacy PIMHAR and add individual pimhar roles
      const pimharIndex = parsed.findIndex(r => r.role === "PIMHAR");
      if (pimharIndex !== -1) {
        const oldPimharPerms = parsed[pimharIndex].permissions;
        parsed.splice(pimharIndex, 1);
        
        const pimharRoles = ["Ketua", "Wakil Ketua", "Sekretaris", "Wakil Sekretaris", "Bendahara", "Wakil Bendahara"];
        pimharRoles.forEach(roleName => {
          if (!parsed.some(r => r.role === roleName)) {
            parsed.push({
              role: roleName,
              permissions: { ...oldPimharPerms } // Inherit previous PIMHAR permissions
            });
          }
        });
        changed = true;
      }
      // Migration: Ensure Anggota has Keuangan view access
      const anggotaIndex = parsed.findIndex(r => r.role === "Anggota");
      if (anggotaIndex !== -1 && !parsed[anggotaIndex].permissions.viewKeuangan) {
        parsed[anggotaIndex].permissions.viewKeuangan = true;
        changed = true;
      }
      
      // Migration: Split Pengaturan into PengaturanSistem and PengaturanWa
      parsed.forEach(r => {
        const perms: any = r.permissions;
        if (perms.hasOwnProperty("viewPengaturan")) {
          perms.viewPengaturanSistem = perms.viewPengaturan;
          perms.viewPengaturanWa = perms.viewPengaturan;
          delete perms.viewPengaturan;
          changed = true;
        }
        if (perms.hasOwnProperty("managePengaturan")) {
          perms.managePengaturanSistem = perms.managePengaturan;
          perms.managePengaturanWa = perms.managePengaturan;
          delete perms.managePengaturan;
          changed = true;
        }
      });
    } catch (e) {
      parsed = [...DEFAULT_ACL];
      changed = true;
    }
  }

  // Auto-sync: Ensure every Bidang in Tasykil has an ACL configuration
  const tasykil = getStoredTasykil();
  tasykil.bidang.forEach(b => {
    const roleName = b.name;
    const exists = parsed.some(r => r.role === roleName);
    if (!exists) {
      parsed.push({
        role: roleName,
        permissions: {
          dashboard: true,
          viewDataAnggota: false,
          manageDataAnggota: false,
          viewTasykil: false,
          manageTasykil: false,
          viewCalonAnggota: false,
          manageCalonAnggota: false,
          viewJadwalKegiatan: true,
          manageJadwalKegiatan: false,
          viewPengaturanSistem: false,
          managePengaturanSistem: false,
          viewPengaturanWa: false,
          managePengaturanWa: false,
          viewKeuangan: false,
          manageKeuangan: false
        }
      });
      changed = true;
    }
  });

  // Clean up legacy roles not present in default ACL or current Tasykil Bidang names
  const validRoles = new Set([
    "Super Admin",
    "Ketua", "Wakil Ketua", "Sekretaris", "Wakil Sekretaris", "Bendahara", "Wakil Bendahara",
    "Anggota",
    "Anggota",
    ...tasykil.bidang.map(b => b.name)
  ]);
  const initialLength = parsed.length;
  parsed = parsed.filter(r => validRoles.has(r.role));
  if (parsed.length !== initialLength) {
    changed = true;
  }

  if (changed) {
    localStorage.setItem(ACL_KEY, JSON.stringify(parsed));
  }

  return parsed;
}

export interface LoginAccount {
  npa: string;
  name: string;
  role: string;
  passwordHash: string; // Plaintext "cirengit23" check in mock
  linkedAnggotaId: string | null;
}

export const DEFAULT_LOGIN_ACCOUNTS: LoginAccount[] = [
  {
    npa: "26.0000",
    name: "Najmi Shofwan Al-Azhar",
    role: "Super Admin",
    passwordHash: "#h1ppa23",
    linkedAnggotaId: "26.0000"
  }
];

const ACCOUNTS_KEY = "simpa_login_accounts";

export function getStoredAccounts(): LoginAccount[] {
  if (typeof window === "undefined") return DEFAULT_LOGIN_ACCOUNTS;
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_LOGIN_ACCOUNTS));
    return DEFAULT_LOGIN_ACCOUNTS;
  }
  try {
    const parsed = JSON.parse(stored) as LoginAccount[];
    // Migration: Reset only if not an array or doesn't contain Najmi
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.some(a => a.npa === "26.0000")) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_LOGIN_ACCOUNTS));
      return DEFAULT_LOGIN_ACCOUNTS;
    }
    let accountsChanged = false;

    // Auto-migrate: Ensure ALL accounts have linkedAnggotaId
    parsed.forEach(acc => {
      if (!acc.linkedAnggotaId) {
        acc.linkedAnggotaId = acc.npa;
        accountsChanged = true;
      }
    });

    // Auto-migrate PIMHAR accounts to specific roles based on Tasykil
    const tasykil = getStoredTasykil();
    parsed.forEach(acc => {
      if (acc.role === "PIMHAR") {
        const id = acc.npa;
        if (tasykil.pimhar.ketua === id) acc.role = "Ketua";
        else if (tasykil.pimhar.wakilKetua === id) acc.role = "Wakil Ketua";
        else if (tasykil.pimhar.sekretaris === id) acc.role = "Sekretaris";
        else if (tasykil.pimhar.wakilSekretaris === id) acc.role = "Wakil Sekretaris";
        else if (tasykil.pimhar.bendahara === id) acc.role = "Bendahara";
        else if (tasykil.pimhar.wakilBendahara === id) acc.role = "Wakil Bendahara";
        else acc.role = "Anggota";
        accountsChanged = true;
      }
    });

    const adminAcc = parsed.find(a => a.npa === "26.0000");
    if (adminAcc && (!adminAcc.linkedAnggotaId || adminAcc.passwordHash === "cirengit23")) {
      adminAcc.linkedAnggotaId = "26.0000";
      adminAcc.passwordHash = "#h1ppa23";
      accountsChanged = true;
    }
    
    if (accountsChanged) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(parsed));
      syncToServer(ACCOUNTS_KEY, parsed);
    }
    return parsed;
  } catch (e) {
    return DEFAULT_LOGIN_ACCOUNTS;
  }
}

export async function saveStoredAccounts(accounts: LoginAccount[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    await syncToServer(ACCOUNTS_KEY, accounts)
  }
}

export function deleteMember(memberId: string) {
  if (typeof window === "undefined") return;

  // 1. Delete from members list
  const members = getStoredMembers();
  const filteredMembers = members.filter(m => m.id !== memberId);
  saveStoredMembers(filteredMembers);

  // 2. Delete associated login account
  const accounts = getStoredAccounts();
  const filteredAccounts = accounts.filter(acc => acc.npa !== memberId && acc.linkedAnggotaId !== memberId);
  saveStoredAccounts(filteredAccounts);

  // 3. Clear references in Tasykil
  const tasykil = getStoredTasykil();
  let tasykilChanged = false;

  // Check pimhar
  const pimharKeys = ["ketua", "wakilKetua", "sekretaris", "wakilSekretaris", "bendahara", "wakilBendahara"] as const;
  for (const key of pimharKeys) {
    if (tasykil.pimhar[key] === memberId) {
      tasykil.pimhar[key] = "";
      tasykilChanged = true;
    }
  }

  // Check bidang members
  tasykil.bidang = tasykil.bidang.map(b => {
    if (b.members.includes(memberId)) {
      tasykilChanged = true;
      return {
        ...b,
        members: b.members.filter(id => id !== memberId)
      };
    }
    return b;
  });

  if (tasykilChanged) {
    saveStoredTasykil(tasykil);
  }
}

export async function saveStoredTasykil(state: TasykilState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TASYKIL_KEY, JSON.stringify(state));
    await syncToServer(TASYKIL_KEY, state)
    
    // Force ACL rules to be generated for new Bidangs and sync to server BEFORE updating accounts
    const aclRules = getStoredAcl();
    await syncToServer("simpa_acl_rules", aclRules);

    // Automatically synchronize account roles
    await syncAccountRolesFromTasykil(state);
  }
}

export async function syncAccountRolesFromTasykil(tasykil: TasykilState) {
  if (typeof window === "undefined") return;

  const accounts = getStoredAccounts();
  const updatedAccounts = accounts.map(acc => {
    // Keep Super Admin role untouched
    if (acc.npa === "26.0000") {
      return { ...acc, role: "Super Admin" };
    }

    const memberId = acc.linkedAnggotaId;
    if (!memberId) {
      return acc;
    }

    // Check if the member is in PIMHAR roles
    if (tasykil.pimhar.ketua === memberId) return { ...acc, role: "Ketua" };
    if (tasykil.pimhar.wakilKetua === memberId) return { ...acc, role: "Wakil Ketua" };
    if (tasykil.pimhar.sekretaris === memberId) return { ...acc, role: "Sekretaris" };
    if (tasykil.pimhar.wakilSekretaris === memberId) return { ...acc, role: "Wakil Sekretaris" };
    if (tasykil.pimhar.bendahara === memberId) return { ...acc, role: "Bendahara" };
    if (tasykil.pimhar.wakilBendahara === memberId) return { ...acc, role: "Wakil Bendahara" };

    // Check if in any Bidang
    for (const b of tasykil.bidang) {
      if (b.members.includes(memberId)) {
        return { ...acc, role: b.name };
      }
    }

    // Default to Anggota
    return { ...acc, role: "Anggota" };
  });

  await saveStoredAccounts(updatedAccounts);
}

export function createMemberAccount(newMember: Member, adminWa: string) {
  if (typeof window === "undefined") return;

  const accounts = getStoredAccounts();
  const existing = accounts.find(a => a.npa === newMember.id || a.linkedAnggotaId === newMember.id);
  if (existing) {
    console.log("Account already exists for member: " + newMember.id);
    return;
  }

  // Create new account
  const newAccount: LoginAccount = {
    npa: newMember.id,
    name: newMember.name,
    role: "Anggota", // Default role
    passwordHash: "#h1ppa23", // Default password
    linkedAnggotaId: newMember.id
  };

  const updatedAccounts = [...accounts, newAccount];
  saveStoredAccounts(updatedAccounts);

  // Send WhatsApp notification
  const waConfig = getWaConfig();
  if (!waConfig || !waConfig.token || waConfig.token === DEFAULT_WA_CONFIG.token) {
    console.log("Fonnte WA Config is not set or using placeholder token, skip sending notification.");
    return;
  }

  const hasMemberWa = newMember.whatsapp && newMember.whatsapp.trim() !== "";
  const targetNumber = (newMember.whatsapp && newMember.whatsapp.trim() !== "") ? newMember.whatsapp.trim() : adminWa;

  if (!targetNumber || targetNumber.trim() === "") {
    console.log("No valid WA number to send to.");
    return;
  }

  let message = "";
  if (hasMemberWa) {
    message = `Assalamu'alaikum, *${newMember.name}*.\n\nSelamat datang di Pemuda Persis Cirengit! Akun SIMPA Anda telah aktif.\n\n🔑 *NPA Login:* ${newMember.id}\n🔒 *Password:* #h1ppa23\n\nSilakan login untuk melengkapi profil dan mengecek jadwal kegiatan.\n\nWassalamu'alaikum.`;
  } else {
    message = `[INFO AKUN BARU]\n\nAnggota: *${newMember.name}*\nNPA: ${newMember.id}\nPassword: #h1ppa23\n\nNomor WA anggota tidak terdaftar / kosong. Sampaikan info login ini secara langsung kepada yang bersangkutan.`;
  }

  fetch("/api/send-wa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target: targetNumber,
      message: message,
      provider: waConfig.provider || "fonnte",
      token: waConfig.token,
      endpoint: waConfig.endpoint,
      metaToken: waConfig.metaToken || "",
      metaPhoneId: waConfig.metaPhoneId || "",
      metaTemplateName: waConfig.metaTemplateWelcome || "welcome_simpa",
      metaTemplateLanguage: "id",
      metaParams: [newMember.name, newMember.id, "#h1ppa23"]
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Notification send result:", data);
  })
  .catch(e => {
    console.error("Gagal mengirim WA notifikasi:", e);
  });
}

export function saveStoredAcl(acl: AclRule[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACL_KEY, JSON.stringify(acl));
    syncToServer(ACL_KEY, acl)
  }
}

export function getCurrentRole(): string {
  if (typeof window === "undefined") return "Super Admin";
  return localStorage.getItem("simpa_current_role") || "Anggota";
}

export function getActualRole(): string {
  if (typeof window === "undefined") return "Super Admin";
  return localStorage.getItem("simpa_actual_role") || "Anggota";
}

export function getCurrentRoleLegacy(): string {
  if (typeof window === "undefined") return "Super Admin";
  const sessionStored = localStorage.getItem("simpa_session");
  if (sessionStored) {
    try {
      const session = JSON.parse(sessionStored);
      if (session && session.role) return session.role;
    } catch(e) {}
  }
  const stored = localStorage.getItem(CURRENT_ROLE_KEY);
  if (!stored) {
    localStorage.setItem(CURRENT_ROLE_KEY, "Super Admin");
    return "Super Admin";
  }
  return stored;
}

export function setCurrentRole(role: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_ROLE_KEY, role);
    syncToServer(CURRENT_ROLE_KEY, role)
    // Dispatch a custom event to notify other components of the role change
    window.dispatchEvent(new Event("simpa_role_changed"));
  }
}

export function getWaTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_WA_TEMPLATE;
  const stored = localStorage.getItem(WA_TEMPLATE_KEY);
  if (!stored) {
    localStorage.setItem(WA_TEMPLATE_KEY, DEFAULT_WA_TEMPLATE);
    return DEFAULT_WA_TEMPLATE;
  }
  return stored;
}

export interface WaConfig {
  provider?: "fonnte" | "self-hosted" | "meta";
  endpoint: string;
  deviceId: string;
  token: string;
  metaToken?: string;
  metaPhoneId?: string;
  metaTemplateWelcome?: string;
  metaTemplateKajian?: string;
  metaTemplateUmum?: string;
}

export const DEFAULT_WA_CONFIG: WaConfig = {
  provider: "fonnte",
  endpoint: "https://api.fonnte.com/send",
  deviceId: "instance-fonnte-cirengit",
  token: "t0k3n-s3cr3t-fonnt3-c1r3ng1t",
  metaToken: "",
  metaPhoneId: "",
  metaTemplateWelcome: "welcome_simpa",
  metaTemplateKajian: "event_kajian",
  metaTemplateUmum: "event_umum"
};

const WA_CONFIG_KEY = "simpa_wa_config";
const PERIODE_JABATAN_KEY = "simpa_periode_jabatan";
const REG_PREFIX_KEY = "simpa_reg_prefix";

export function getWaConfig(): WaConfig {
  if (typeof window === "undefined") return DEFAULT_WA_CONFIG;
  const stored = localStorage.getItem(WA_CONFIG_KEY);
  if (!stored || stored === "null") {
    localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(DEFAULT_WA_CONFIG));
    return DEFAULT_WA_CONFIG;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed) return DEFAULT_WA_CONFIG;
    return parsed;
  } catch (e) {
    return DEFAULT_WA_CONFIG;
  }
}

export function saveWaConfig(config: WaConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(config));
    syncToServer(WA_CONFIG_KEY, config)
  }
}

export function getPeriodeJabatan(): string {
  if (typeof window === "undefined") return "2026 - 2028";
  const stored = localStorage.getItem(PERIODE_JABATAN_KEY);
  if (!stored || stored === "null") {
    localStorage.setItem(PERIODE_JABATAN_KEY, "2026 - 2028");
    return "2026 - 2028";
  }
  return stored;
}

export function savePeriodeJabatan(periode: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PERIODE_JABATAN_KEY, periode);
    syncToServer(PERIODE_JABATAN_KEY, periode)
    window.dispatchEvent(new Event("simpa_role_changed"));
  }
}

export function getRegistrationPrefix(): string {
  if (typeof window === "undefined") return "REG";
  const stored = localStorage.getItem(REG_PREFIX_KEY);
  if (!stored || stored === "null") {
    localStorage.setItem(REG_PREFIX_KEY, "REG");
    return "REG";
  }
  return stored;
}

export interface KopSuratConfig {
  logoKiriUrl: string;
  logoKananUrl: string;
  namaOrganisasi: string;
  namaInstansi: string;
  alamat: string;
}

export function saveRegistrationPrefix(prefix: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("simpa_reg_prefix", prefix)
    syncToServer(REG_PREFIX_KEY, prefix)
    window.dispatchEvent(new Event("simpa_role_changed"));
  }
}

export const DEFAULT_KOP_SURAT: KopSuratConfig = {
  logoKiriUrl: "/logo.png",
  logoKananUrl: "",
  namaOrganisasi: "HIMPUNAN PELAJAR PERSATUAN ISLAM PUTRA (HIPPA)",
  namaInstansi: "PIMPINAN JAMAAH CIRENGIT",
  alamat: "Cirengit, Ds. Cangkuang, Kec. Cangkuang, Kab. Bandung",
}

export function getKopSuratConfig(): KopSuratConfig {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("simpa_kop_surat")
    if (saved) return JSON.parse(saved)
  }
  return DEFAULT_KOP_SURAT
}

export function saveKopSuratConfig(config: KopSuratConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem("simpa_kop_surat", JSON.stringify(config))
  }
}

export function saveWaTemplate(template: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WA_TEMPLATE_KEY, template);
    syncToServer(WA_TEMPLATE_KEY, template)
  }
}

const WA_TEMPLATE_KAJIAN_KEY = "simpa_wa_template_kajian";
const WA_TEMPLATE_UMUM_KEY = "simpa_wa_template_umum";

export const DEFAULT_WA_TEMPLATE_KAJIAN = `*Pengingat Kajian HIPPA Cirengit*

Halo {{NAMA}},

Hadirilah kajian dengan tema *{{TEMA}}* dan judul *{{KEGIATAN}}* bersama ustadz/pemateri *{{PEMATERI}}*.

📅 Tanggal: {{TANGGAL}}
🕒 Jam: {{JAM}} WIB
📍 Lokasi: {{LOKASI}}

Semoga Allah memudahkan langkah kita ke majelis ilmu.`;

export const DEFAULT_WA_TEMPLATE_UMUM = `*Pengingat Agenda Pemuda HIPPA*

Halo {{NAMA}},

Diingatkan kembali bahwa ada agenda *{{KEGIATAN}}* yang akan dilaksanakan pada:

📅 Tanggal: {{TANGGAL}}
🕒 Jam: {{JAM}} WIB
📍 Lokasi: {{LOKASI}}

Kehadiran dan kontribusi rekan-rekan sangat diharapkan.`;

export function getWaTemplateKajian(): string {
  if (typeof window === "undefined") return DEFAULT_WA_TEMPLATE_KAJIAN;
  const stored = localStorage.getItem(WA_TEMPLATE_KAJIAN_KEY);
  if (!stored) {
    localStorage.setItem(WA_TEMPLATE_KAJIAN_KEY, DEFAULT_WA_TEMPLATE_KAJIAN);
    return DEFAULT_WA_TEMPLATE_KAJIAN;
  }
  return stored;
}

export function saveWaTemplateKajian(template: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WA_TEMPLATE_KAJIAN_KEY, template);
    syncToServer(WA_TEMPLATE_KAJIAN_KEY, template)
  }
}

export function getWaTemplateUmum(): string {
  if (typeof window === "undefined") return DEFAULT_WA_TEMPLATE_UMUM;
  const stored = localStorage.getItem(WA_TEMPLATE_UMUM_KEY);
  if (!stored) {
    localStorage.setItem(WA_TEMPLATE_UMUM_KEY, DEFAULT_WA_TEMPLATE_UMUM);
    return DEFAULT_WA_TEMPLATE_UMUM;
  }
  return stored;
}

export function saveWaTemplateUmum(template: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WA_TEMPLATE_UMUM_KEY, template);
    syncToServer(WA_TEMPLATE_UMUM_KEY, template)
  }
}

export interface Applicant {
  id: string;
  name: string;
  date: string;
  contact: string | null;
  email?: string | null;
  status: "Menunggu" | "Proses" | "Diterima" | "Ditolak";
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  rtRw?: string | null;
  kelDesa?: string | null;
  kecamatan?: string | null;
  kabKota?: string | null;
  pekerjaan: string;
}

const APPLICANTS_KEY = "simpa_calon_anggota";

export function getStoredApplicants(): Applicant[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(APPLICANTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveStoredApplicants(applicants: Applicant[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
    syncToServer(APPLICANTS_KEY, applicants)
  }
}

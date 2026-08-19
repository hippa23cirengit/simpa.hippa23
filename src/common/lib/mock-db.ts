export interface Member {
  id: string;
  name: string;
  role: string; // e.g. "Ketua", "Sekretaris", "Bendahara", "Bidang Publikasi", or "-"
  status: "Aktif" | "Tidak Aktif" | "Alumni";
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  pekerjaan: string;
  whatsapp: string;
  email: string; // Added for password reset
  profilePhoto?: string; // Supabase Storage public URL
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
    viewPengaturan: boolean;
    managePengaturan: boolean;
  };
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
const TASYKIL_KEY = "simpa_tasykil_state"

// Backend sync helper
function syncToServer(key: string, value: any) {
  if (typeof window !== "undefined") {
    fetch("/api/db-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value })
    }).catch(e => console.error("Gagal sinkronisasi data ke server:", e))
  }
}

export async function syncDatabaseFromServer() {
  if (typeof window === "undefined") return
  try {
    const res = await fetch("/api/db-sync")
    const resData = await res.json()
    if (resData.status && resData.data) {
      const data = resData.data
      Object.keys(data).forEach(key => {
        const valStr = typeof data[key] === "string" ? data[key] : JSON.stringify(data[key])
        localStorage.setItem(key, valStr)
      })
      // Dispatch event to sync UI
      window.dispatchEvent(new Event("simpa_role_changed"))
    }
  } catch (e) {
    console.error("Gagal sinkronisasi data dari server:", e)
  }
}

export function getStoredMembers(): Member[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS
  const stored = localStorage.getItem(MEMBERS_KEY)
  if (!stored) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS))
    syncToServer(MEMBERS_KEY, DEFAULT_MEMBERS)
    return DEFAULT_MEMBERS
  }
  try {
    const parsed = JSON.parse(stored) as Member[]
    // Migration: Reset if legacy format or first member is not Najmi
    if (parsed.length === 0 || parsed[0].id !== "26.0000" || parsed[0].name !== "Najmi Shofwan Al-Azhar") {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS))
      localStorage.setItem(TASYKIL_KEY, JSON.stringify(DEFAULT_TASYKIL))
      syncToServer(MEMBERS_KEY, DEFAULT_MEMBERS)
      syncToServer(TASYKIL_KEY, DEFAULT_TASYKIL)
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
    syncToServer(TASYKIL_KEY, DEFAULT_TASYKIL)
    return DEFAULT_TASYKIL;
  }
  try {
    const parsed = JSON.parse(stored);
    // Migration check: if legacy penasehat is a string, wrap it in an array!
    if (typeof parsed.penasehat === "string") {
      parsed.penasehat = parsed.penasehat ? [parsed.penasehat] : [];
      localStorage.setItem(TASYKIL_KEY, JSON.stringify(parsed));
      syncToServer(TASYKIL_KEY, parsed)
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

export const DEFAULT_EVENTS: ScheduledEvent[] = [
  {
    id: "evt-1",
    title: "Kajian Rutin Pemuda: Peran Pemuda di Era Digital",
    date: "2026-08-22",
    time: "19:30",
    location: "Masjid Al-Ikhlas Cirengit",
    color: "blue",
    type: "kajian",
    speaker: "Ustadz Evie Effendi",
    theme: "Pemuda Hijrah"
  },
  {
    id: "evt-2",
    title: "Olahraga Futsal Rutin Pemuda",
    date: "2026-08-23",
    time: "16:00",
    location: "Futsal Center Cirengit",
    color: "emerald",
    type: "umum"
  },
  {
    id: "evt-3",
    title: "Rapat Pleno Pengurus Bulanan",
    date: "2026-08-28",
    time: "09:00",
    location: "Sekretariat HIPPA Cirengit",
    color: "amber",
    type: "umum"
  }
];

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
      viewPengaturan: true,
      managePengaturan: true
    }
  },
  {
    role: "PIMHAR",
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
      viewPengaturan: false,
      managePengaturan: false
    }
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
      viewPengaturan: false,
      managePengaturan: false
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
    syncToServer(EVENTS_KEY, DEFAULT_EVENTS)
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
          viewPengaturan: false,
          managePengaturan: false
        }
      });
      changed = true;
    }
  });

  // Clean up legacy roles not present in default ACL or current Tasykil Bidang names
  const validRoles = new Set([
    "Super Admin",
    "PIMHAR",
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
    syncToServer(ACL_KEY, parsed)
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
    syncToServer(ACCOUNTS_KEY, DEFAULT_LOGIN_ACCOUNTS)
    return DEFAULT_LOGIN_ACCOUNTS;
  }
  try {
    const parsed = JSON.parse(stored) as LoginAccount[];
    // Migration: If Najmi is not the first account, reset to ensure sync
    if (parsed.length === 0 || parsed[0].npa !== "26.0000") {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_LOGIN_ACCOUNTS));
      syncToServer(ACCOUNTS_KEY, DEFAULT_LOGIN_ACCOUNTS)
      return DEFAULT_LOGIN_ACCOUNTS;
    }
    // Auto-migrate: Ensure Super Admin is linked to the member record and has new password
    if (parsed[0].npa === "26.0000" && (!parsed[0].linkedAnggotaId || parsed[0].passwordHash === "cirengit23")) {
      parsed[0].linkedAnggotaId = "26.0000";
      parsed[0].passwordHash = "#h1ppa23";
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(parsed));
      syncToServer(ACCOUNTS_KEY, parsed);
    }
    return parsed;
  } catch (e) {
    return DEFAULT_LOGIN_ACCOUNTS;
  }
}

export function saveStoredAccounts(accounts: LoginAccount[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    syncToServer(ACCOUNTS_KEY, accounts)
  }
}

export function saveStoredTasykil(state: TasykilState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TASYKIL_KEY, JSON.stringify(state));
    syncToServer(TASYKIL_KEY, state)
    // Automatically synchronize account roles
    syncAccountRolesFromTasykil(state);
  }
}

export function syncAccountRolesFromTasykil(tasykil: TasykilState) {
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
    const isPimhar = 
      tasykil.pimhar.ketua === memberId ||
      tasykil.pimhar.wakilKetua === memberId ||
      tasykil.pimhar.sekretaris === memberId ||
      tasykil.pimhar.wakilSekretaris === memberId ||
      tasykil.pimhar.bendahara === memberId ||
      tasykil.pimhar.wakilBendahara === memberId;

    if (isPimhar) {
      return { ...acc, role: "PIMHAR" };
    }

    // Check if in any Bidang
    for (const b of tasykil.bidang) {
      if (b.members.includes(memberId)) {
        return { ...acc, role: b.name };
      }
    }

    // Default to Anggota
    return { ...acc, role: "Anggota" };
  });

  saveStoredAccounts(updatedAccounts);
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
  const targetNumber = hasMemberWa ? newMember.whatsapp.trim() : adminWa;

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
      token: waConfig.token,
      endpoint: waConfig.endpoint
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
    syncToServer(CURRENT_ROLE_KEY, "Super Admin")
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
    syncToServer(WA_TEMPLATE_KEY, DEFAULT_WA_TEMPLATE)
    return DEFAULT_WA_TEMPLATE;
  }
  return stored;
}

export interface WaConfig {
  endpoint: string;
  deviceId: string;
  token: string;
}

export const DEFAULT_WA_CONFIG: WaConfig = {
  endpoint: "https://api.fonnte.com/send",
  deviceId: "instance-fonnte-cirengit",
  token: "t0k3n-s3cr3t-fonnt3-c1r3ng1t"
};

const WA_CONFIG_KEY = "simpa_wa_config";
const PERIODE_JABATAN_KEY = "simpa_periode_jabatan";

export function getWaConfig(): WaConfig {
  if (typeof window === "undefined") return DEFAULT_WA_CONFIG;
  const stored = localStorage.getItem(WA_CONFIG_KEY);
  if (!stored) {
    localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(DEFAULT_WA_CONFIG));
    syncToServer(WA_CONFIG_KEY, DEFAULT_WA_CONFIG)
    return DEFAULT_WA_CONFIG;
  }
  try {
    return JSON.parse(stored);
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
  if (!stored) {
    localStorage.setItem(PERIODE_JABATAN_KEY, "2026 - 2028");
    syncToServer(PERIODE_JABATAN_KEY, "2026 - 2028")
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
    syncToServer(WA_TEMPLATE_KAJIAN_KEY, DEFAULT_WA_TEMPLATE_KAJIAN)
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
    syncToServer(WA_TEMPLATE_UMUM_KEY, DEFAULT_WA_TEMPLATE_UMUM)
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

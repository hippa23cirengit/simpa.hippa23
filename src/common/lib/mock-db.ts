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

export function getStoredMembers(): Member[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS
  const stored = localStorage.getItem(MEMBERS_KEY)
  if (!stored) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS))
    return DEFAULT_MEMBERS
  }
  try {
    const parsed = JSON.parse(stored) as Member[]
    // Migration: Reset if legacy format or first member is not Najmi
    if (parsed.length === 0 || parsed[0].id !== "26.0000" || parsed[0].name !== "Najmi Shofwan Al-Azhar") {
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

export function saveStoredTasykil(state: TasykilState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TASYKIL_KEY, JSON.stringify(state));
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
    title: "Rapat Rutin Pengurus",
    date: "2026-08-02",
    time: "19:30",
    location: "Masjid Al-Hikmah Cirengit",
    color: "blue"
  },
  {
    id: "evt-2",
    title: "Pelatihan Kader Digital",
    date: "2026-08-09",
    time: "09:00",
    location: "Aula Desa Cirengit",
    color: "amber"
  },
  {
    id: "evt-3",
    title: "Bakti Sosial & Pembagian Air",
    date: "2026-08-22",
    time: "08:00",
    location: "Kawasan RW 05 Desa Cirengit",
    color: "emerald"
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
    passwordHash: "cirengit23",
    linkedAnggotaId: null
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
    // Migration: If Najmi is not the first account, reset to ensure sync
    if (parsed.length === 0 || parsed[0].npa !== "26.0000") {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_LOGIN_ACCOUNTS));
      return DEFAULT_LOGIN_ACCOUNTS;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_LOGIN_ACCOUNTS;
  }
}

export function saveStoredAccounts(accounts: LoginAccount[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export function saveStoredAcl(acl: AclRule[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACL_KEY, JSON.stringify(acl));
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
    return "Super Admin";
  }
  return stored;
}

export function setCurrentRole(role: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_ROLE_KEY, role);
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
  }
}

export function getPeriodeJabatan(): string {
  if (typeof window === "undefined") return "2026 - 2028";
  const stored = localStorage.getItem(PERIODE_JABATAN_KEY);
  if (!stored) {
    localStorage.setItem(PERIODE_JABATAN_KEY, "2026 - 2028");
    return "2026 - 2028";
  }
  return stored;
}

export function savePeriodeJabatan(periode: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PERIODE_JABATAN_KEY, periode);
    window.dispatchEvent(new Event("simpa_role_changed"));
  }
}

export function saveWaTemplate(template: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WA_TEMPLATE_KEY, template);
  }
}

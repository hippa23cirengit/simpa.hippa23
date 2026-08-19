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
  role: string; // 'Super Admin' | 'PIMHAR' | 'Bidang' | 'Anggota'
  permissions: {
    dashboard: boolean;
    dataAnggota: boolean;
    tasykil: boolean;
    calonAnggota: boolean;
    jadwalKegiatan: boolean;
    pengaturan: boolean;
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
      dataAnggota: true,
      tasykil: true,
      calonAnggota: true,
      jadwalKegiatan: true,
      pengaturan: true
    }
  },
  {
    role: "PIMHAR",
    permissions: {
      dashboard: true,
      dataAnggota: true,
      tasykil: true,
      calonAnggota: true,
      jadwalKegiatan: true,
      pengaturan: false
    }
  },
  {
    role: "Bidang",
    permissions: {
      dashboard: true,
      dataAnggota: true,
      tasykil: true, // Read-Only
      calonAnggota: true, // Read-Only
      jadwalKegiatan: true,
      pengaturan: false
    }
  },
  {
    role: "Anggota",
    permissions: {
      dashboard: true,
      dataAnggota: true, // Read-Only
      tasykil: true, // Read-Only
      calonAnggota: true, // Read-Only
      jadwalKegiatan: true, // Read-Only
      pengaturan: false
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
  if (!stored) {
    localStorage.setItem(ACL_KEY, JSON.stringify(DEFAULT_ACL));
    return DEFAULT_ACL;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_ACL;
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

export function saveWaTemplate(template: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WA_TEMPLATE_KEY, template);
  }
}

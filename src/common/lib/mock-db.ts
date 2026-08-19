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
    id: "23.001",
    name: "Ahmad Fauzan",
    role: "Ketua",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2001-04-12",
    alamat: "Kp. Cirengit RT 02/RW 04, Desa Cirengit, Bandung",
    pekerjaan: "Mahasiswa",
    whatsapp: "0812-3456-7890",
    email: "ahmad.fauzan@gmail.com"
  },
  {
    id: "23.002",
    name: "Rizky Ibrahim",
    role: "Sekretaris",
    status: "Aktif",
    tempatLahir: "Garut",
    tanggalLahir: "2000-08-21",
    alamat: "Kp. Cirengit RT 01/RW 04, Desa Cirengit, Bandung",
    pekerjaan: "Wirausaha",
    whatsapp: "0821-9876-5432",
    email: "rizky.ibrahim@gmail.com"
  },
  {
    id: "23.003",
    name: "Muhammad Ali",
    role: "Bendahara",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2002-11-03",
    alamat: "Perumahan Cirengit Indah Blok C No. 5, Bandung",
    pekerjaan: "Karyawan Swasta",
    whatsapp: "0852-1122-3344",
    email: "muhammad.ali@gmail.com"
  },
  {
    id: "23.004",
    name: "Fajar Ramadhan",
    role: "Bidang Kaderisasi",
    status: "Aktif",
    tempatLahir: "Sumedang",
    tanggalLahir: "2001-09-15",
    alamat: "Kp. Cirengit Kolot RT 03/RW 05, Desa Cirengit, Bandung",
    pekerjaan: "Mahasiswa",
    whatsapp: "0898-7654-3210",
    email: "fajar.ramadhan@gmail.com"
  },
  {
    id: "23.005",
    name: "Ilham Saputra",
    role: "Bidang Pendidikan",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2003-01-28",
    alamat: "Jl. Raya Cirengit No. 42, Bandung",
    pekerjaan: "Pelajar",
    whatsapp: "0877-2233-4455",
    email: "ilham.saputra@gmail.com"
  },
  {
    id: "23.006",
    name: "Budi Santoso",
    role: "Bidang Organisasi",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "1999-05-19",
    alamat: "Kp. Cirengit RT 04/RW 04, Desa Cirengit, Bandung",
    pekerjaan: "Wirausaha",
    whatsapp: "0813-9988-7766",
    email: "budi.santoso@gmail.com"
  },
  {
    id: "23.007",
    name: "Ridwan Kamil",
    role: "Bidang Sosial",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2000-06-06",
    alamat: "Jl. Cirengit Raya Blok F No. 12, Bandung",
    pekerjaan: "Karyawan Swasta",
    whatsapp: "0822-4433-2211",
    email: "ridwan.kamil@gmail.com"
  },
  {
    id: "23.008",
    name: "Hasanuddin",
    role: "-",
    status: "Aktif",
    tempatLahir: "Cianjur",
    tanggalLahir: "2002-12-12",
    alamat: "Kp. Pasir RT 02/RW 03, Cirengit, Bandung",
    pekerjaan: "Mahasiswa",
    whatsapp: "0812-7788-9900",
    email: "hasanuddin@gmail.com"
  },
  {
    id: "23.009",
    name: "Cecep Solihin",
    role: "-",
    status: "Tidak Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2001-10-10",
    alamat: "Kp. Cirengit RT 02/RW 04, Desa Cirengit, Bandung",
    pekerjaan: "Wirausaha",
    whatsapp: "0838-1122-4455",
    email: "cecep.solihin@gmail.com"
  },
  {
    id: "23.010",
    name: "Dadang Hermawan",
    role: "-",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2003-02-14",
    alamat: "Kp. Cirengit RT 03/RW 04, Desa Cirengit, Bandung",
    pekerjaan: "Pelajar",
    whatsapp: "0857-8899-0011",
    email: "dadang.hermawan@gmail.com"
  },
  {
    id: "23.011",
    name: "Eman Sulaeman",
    role: "-",
    status: "Aktif",
    tempatLahir: "Tasikmalaya",
    tanggalLahir: "2000-03-03",
    alamat: "Jl. Cirengit Baru No. 15, Bandung",
    pekerjaan: "Mahasiswa",
    whatsapp: "0896-1234-5678",
    email: "eman.sulaeman@gmail.com"
  },
  {
    id: "23.012",
    name: "Fikri Ramadhan",
    role: "-",
    status: "Alumni",
    tempatLahir: "Bandung",
    tanggalLahir: "1997-07-07",
    alamat: "Kp. Cirengit RT 01/RW 05, Desa Cirengit, Bandung",
    pekerjaan: "PNS",
    whatsapp: "0812-9900-1122",
    email: "fikri.ramadhan@gmail.com"
  },
  {
    id: "23.013",
    name: "Ginanjar Kartasasmita",
    role: "-",
    status: "Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2002-05-05",
    alamat: "Perum Cirengit Blok A No. 1, Bandung",
    pekerjaan: "Mahasiswa",
    whatsapp: "0821-3344-5566",
    email: "ginanjar.kartasasmita@gmail.com"
  },
  {
    id: "23.014",
    name: "Heri Hermawan",
    role: "-",
    status: "Tidak Aktif",
    tempatLahir: "Bandung",
    tanggalLahir: "2001-11-11",
    alamat: "Kp. Pasir RT 01/RW 03, Cirengit, Bandung",
    pekerjaan: "Karyawan Swasta",
    whatsapp: "0852-6677-8899",
    email: "heri.hermawan@gmail.com"
  },
  {
    id: "23.015",
    name: "Irfan Hakim",
    role: "-",
    status: "Aktif",
    tempatLahir: "Sukabumi",
    tanggalLahir: "2000-09-09",
    alamat: "Jl. Cirengit Kolot RT 02/RW 05, Bandung",
    pekerjaan: "Wirausaha",
    whatsapp: "0878-5566-7788",
    email: "irfan.hakim@gmail.com"
  }
]

export const DEFAULT_TASYKIL: TasykilState = {
  penasehat: ["Ust. H. Ahmad Gozali", "Ust. KH. Aceng Zakaria"],
  pimhar: {
    ketua: "23.001", // Ahmad Fauzan
    wakilKetua: "",
    sekretaris: "23.002", // Rizky Ibrahim
    wakilSekretaris: "",
    bendahara: "23.003", // Muhammad Ali
    wakilBendahara: ""
  },
  bidang: [
    { id: "bidang-kaderisasi", name: "Bidang Kaderisasi", members: ["23.004"] },
    { id: "bidang-pendidikan", name: "Bidang Pendidikan", members: ["23.005"] },
    { id: "bidang-organisasi", name: "Bidang Organisasi", members: ["23.006"] },
    { id: "bidang-sosial", name: "Bidang Sosial", members: ["23.007"] }
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
    // Migration: Reset if legacy HPA format or 4-digit sequence format is found
    if (parsed.length > 0 && (parsed[0].id.startsWith("HPA") || parsed[0].id.includes(".000") || !parsed[0].hasOwnProperty("email"))) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS))
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

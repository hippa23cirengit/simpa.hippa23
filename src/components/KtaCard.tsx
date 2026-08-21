import * as React from "react"
import { Member, KtaSettings } from "@/common/lib/mock-db"

interface KtaCardProps {
  member: Member;
  ktaSettings: KtaSettings;
  side: "front" | "back";
}

export function KtaCard({ member, ktaSettings, side }: KtaCardProps) {
  // Formatting dates (assuming DD Month, YYYY)
  const formatTanggalLahir = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (side === "back") {
    return (
      <div 
        className="relative bg-white shadow-xl rounded-[20px] overflow-hidden shrink-0 print:shadow-none print:break-inside-avoid" 
        style={{ 
          width: "85.6mm", 
          height: "54mm", 
          backgroundImage: 'url("/belakang revisi.png")', 
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        {/* Sisi belakang sudah statis */}
      </div>
    )
  }

  return (
    <div 
      className="relative bg-white shadow-xl rounded-[20px] overflow-hidden shrink-0 print:shadow-none print:break-inside-avoid" 
      style={{ 
        width: "85.6mm", 
        height: "54mm", 
        backgroundImage: 'url("/depan-revisi.png")', 
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        color: "#000",
        fontFamily: "Arial, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* === KOORDINAT TEKS DATA PRIBADI === */}
      <div className="absolute font-semibold text-[#1a1a1a] text-[8px] leading-snug flex flex-col gap-[3.5%]" style={{ left: "33.5%", top: "25.6%", width: "40%", height: "60%" }}>
        <div style={{ position: "absolute", top: "0%" }}>{member.name.toUpperCase()}</div>
        <div style={{ position: "absolute", top: "11%" }}>{member.id}</div>
        <div style={{ position: "absolute", top: "21.5%" }}>{member.tempatLahir}</div>
        <div style={{ position: "absolute", top: "32.5%" }}>{formatTanggalLahir(member.tanggalLahir)}</div>
        
        {/* Alamat Block */}
        <div style={{ position: "absolute", top: "43%" }} className="w-full leading-none line-clamp-2">{member.alamat}</div>
        <div style={{ position: "absolute", top: "54%" }}>{member.rtRw || "-"}</div>
        <div style={{ position: "absolute", top: "64.5%" }}>{member.kelDesa || "-"}</div>
        <div style={{ position: "absolute", top: "75.5%" }}>{member.kecamatan || "-"}</div>
        
        <div style={{ position: "absolute", top: "86.5%" }}>{member.pekerjaan || "-"}</div>
        <div style={{ position: "absolute", top: "97%" }}>Seumur Hidup</div>
      </div>

      {/* === KOORDINAT PAS FOTO === */}
      <div 
        className="absolute overflow-hidden rounded-[8px] flex items-center justify-center"
        style={{
          left: "74.3%",
          top: "27.5%",
          width: "17.1%",
          height: "38.2%"
        }}
      >
        <img src={member.profilePhoto || "/default pic.webp"} alt="Foto" className="w-full h-full object-cover" />
      </div>

      {/* === KOORDINAT TANDA TANGAN & KETUA === */}
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: "71%", top: "70%", width: "23%" }}>
        {/* Tanda Tangan */}
        <div className="h-8 w-full flex items-center justify-center mb-1 relative">
          {ktaSettings.signatureUrl ? (
            <img src={ktaSettings.signatureUrl} alt="Signature" className="h-9 absolute object-contain mix-blend-multiply translate-y-3" />
          ) : null}
        </div>
        
        {/* Nama Ketua */}
        <div className="font-bold text-[5.5px] underline underline-offset-1">
          {ktaSettings.ketuaName || "Nama Ketua"}
        </div>
        {/* NPA Ketua */}
        <div className="font-bold text-[5px] -mt-[1px]">
          NPA. {ktaSettings.ketuaNpa || "00.0000"}
        </div>
      </div>
    </div>
  )
}

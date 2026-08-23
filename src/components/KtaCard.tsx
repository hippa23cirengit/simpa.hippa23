import * as React from "react"
import { Member, KtaSettings } from "@/common/lib/mock-db"
import QRCode from "react-qr-code"

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
        className="relative bg-white border border-slate-300 shadow-xl rounded-[20px] overflow-hidden shrink-0 print:shadow-none print:break-inside-avoid" 
        style={{ 
          width: "85.6mm", 
          height: "54mm", 
          color: "#000",
          fontFamily: "Arial, sans-serif",
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden"
        }}
      >
        <img 
          src="/REVISI-KTA-HIPPA-BELAKANG.png" 
          alt="KTA Belakang" 
          className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
          style={{
            imageRendering: "-webkit-optimize-contrast",
            // @ts-ignore
            imageRendering: "crisp-edges"
          }}
        />

        {/* === KOORDINAT TEKS ALAMAT KIRI === */}
        <div className="absolute font-medium text-[#1a1a1a] text-[8px] leading-[1.3] flex flex-col justify-center z-10" style={{ left: "8.5%", top: "25%", width: "56%", height: "50%" }}>
          <div>Sekretariat Pemuda Persis Cirengit,</div>
          <div>Kp. Cirengit RT.03 RW.03, Ds. Tanjungsari, Kec. Cangkuang, Kab. Bandung, 40238</div>
          <div className="mt-[2px]">email: <b>pemudapersiscirengit@gmail.com</b></div>
          
          <div className="mt-2 text-[7px] leading-snug">Scan QR Code disamping untuk membuka Sistem Informasi Manajemen Pengurus & Anggota (SIMPA) HIPPA Cirengit</div>
        </div>

        {/* === KOORDINAT QR CODE KANAN === */}
        <div className="absolute flex items-center justify-center z-10" style={{ left: "67.5%", top: "27.5%", width: "24%", height: "45%" }}>
          <div className="bg-white p-[3px] rounded-md border border-slate-200 shadow-sm flex items-center justify-center w-full aspect-square">
            <QRCode 
              value="https://simpa.pemudapersiscirengit.org" 
              size={128}
              style={{ height: "100%", maxWidth: "100%", width: "100%" }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative bg-white border border-slate-300 shadow-xl rounded-[20px] overflow-hidden shrink-0 print:shadow-none print:break-inside-avoid"
      style={{
        width: "85.6mm",
        height: "54mm",
        color: "#000",
        fontFamily: "Arial, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        transform: "translate3d(0,0,0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden"
      }}
    >
      <img
        src="/REVISI-KTA-DEPAN.png"
        alt="KTA Depan"
        className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
        style={{
          imageRendering: "-webkit-optimize-contrast",
          // @ts-ignore
          imageRendering: "crisp-edges"
        }}
      />

      {/* === KOORDINAT TEKS DATA PRIBADI === */}
      <div className="absolute font-semibold text-[#1a1a1a] text-[8px] leading-snug flex flex-col justify-between z-10" style={{ left: "8.5%", top: "27%", width: "60.5%", height: "59%" }}>
        <div className="flex w-full items-start">
          <div className="w-[33%]">Nama</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.name.toUpperCase()}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%]">NPA HIPPA</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.id}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%]">Tempat Lahir</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.tempatLahir}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%]">Tanggal Lahir</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{formatTanggalLahir(member.tanggalLahir)}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%]">Alamat</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 leading-tight line-clamp-2">{member.alamat}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%] pl-2">RT/RW</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.rtRw || "-"}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%] pl-2">Kel/Desa</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.kelDesa || "-"}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%] pl-2">Kecamatan</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.kecamatan || "-"}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%] pl-2">Kab/Kota</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.kabKota || "-"}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%]">Pekerjaan</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">{member.pekerjaan || "-"}</div>
        </div>
        <div className="flex w-full items-start">
          <div className="w-[33%]">Berlaku Hingga</div>
          <div className="w-[3%]">:</div>
          <div className="flex-1 truncate">Seumur Hidup</div>
        </div>
      </div>

      {/* === KOORDINAT PAS FOTO === */}
      <div
        className="absolute overflow-hidden rounded-[8px] flex items-center justify-center z-10 bg-[#cbd5e1] border border-slate-400"
        style={{
          left: "71%",
          top: "25.5%",
          width: "23%",
          height: "42%"
        }}
      >
        <img
          src={member.profilePhoto || "/default pic.webp"}
          alt="Foto"
          className="w-full h-full object-cover"
          style={{
            imageRendering: "-webkit-optimize-contrast",
            // @ts-ignore
            imageRendering: "crisp-edges"
          }}
        />
      </div>

      {/* === KOORDINAT TANDA TANGAN & KETUA === */}
      <div className="absolute flex flex-col items-center justify-center text-center z-10" style={{ left: "71%", top: "71.5%", width: "23%" }}>
        {/* Teks Mengetahui */}
        <div className="font-bold text-[4.5px] leading-[1.1]">Mengetahui,</div>
        <div className="font-bold text-[4.5px] leading-[1.1]">Ketua PJ. Pemuda Persis Cirengit,</div>

        {/* Tanda Tangan */}
        <div className="h-5 w-full flex items-center justify-center relative mt-[1px] mb-[1px]">
          {ktaSettings.signatureUrl ? (
            <img
              src={ktaSettings.signatureUrl}
              alt="Signature"
              className="h-7 absolute object-contain mix-blend-multiply"
              style={{
                imageRendering: "-webkit-optimize-contrast",
                // @ts-ignore
                imageRendering: "crisp-edges"
              }}
            />
          ) : null}
        </div>

        {/* Nama Ketua */}
        <div className="font-bold text-[5.5px] underline underline-offset-1">
          {ktaSettings.ketuaName || "Nama Ketua"}
        </div>
        {/* NPA Ketua */}
        <div className="font-bold text-[5px] mt-[1px]">
          NPA. {ktaSettings.ketuaNpa || "00.0000"}
        </div>
      </div>
    </div>
  )
}

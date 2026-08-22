import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { getKopSuratConfig } from "../lib/mock-db";

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  columns?: string[];
  rows?: (string | number)[][];
  summaryRows?: (string | number)[][];
  tables?: {
    subtitle?: string;
    columns: string[];
    rows: (string | number)[][];
    summaryRows?: (string | number)[][];
  }[];
  filename?: string;
  orientation?: "portrait" | "landscape";
}

export const generatePdf = async ({
  title,
  subtitle,
  columns,
  rows,
  summaryRows,
  tables,
  filename = "document.pdf",
  orientation,
}: PdfExportOptions) => {
  // Create jsPDF instance
  const config = getKopSuratConfig();
  
  // Determine orientation based on prop, or fallback to column count
  const firstCols = tables && tables.length > 0 ? tables[0].columns : (columns || []);
  const docOrientation = orientation || (firstCols.length > 6 ? "landscape" : "portrait");
  const doc = new jsPDF(docOrientation, "mm", "a4");

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        return resolve({ width: 25, height: 25 });
      }
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => {
        console.warn("Failed to load image dimensions for", url);
        resolve({ width: 25, height: 25 });
      };
      img.src = url;
    });
  };

  const loadBase64Image = async (url: string): Promise<string> => {
    if (!url) return "";
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Failed to load image:", url, error);
      return "";
    }
  };

  const logoKiriBase64 = await loadBase64Image(config.logoKiriUrl);
  const logoKananBase64 = await loadBase64Image(config.logoKananUrl);

  // Kop Surat Header
  const pageWidth = doc.internal.pageSize.getWidth();
  
  if (logoKiriBase64) {
    const dim = await getImageDimensions(config.logoKiriUrl);
    const ratio = dim.width / dim.height;
    const drawHeight = 25;
    const drawWidth = drawHeight * ratio;
    doc.addImage(logoKiriBase64, "PNG", 15, 10, drawWidth, drawHeight);
  }

  if (logoKananBase64) {
    const dim = await getImageDimensions(config.logoKananUrl);
    const ratio = dim.width / dim.height;
    const drawHeight = 25;
    const drawWidth = drawHeight * ratio;
    // Align to the right based on its dynamic width
    doc.addImage(logoKananBase64, "PNG", pageWidth - 15 - drawWidth, 10, drawWidth, drawHeight);
  }

  // Teks Kop Surat
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(config.namaOrganisasi || "HIMPUNAN PELAJAR PERSATUAN ISLAM PUTRA (HIPPA)", pageWidth / 2, 17, { align: "center" });
  
  doc.setFontSize(11);
  doc.text(config.namaInstansi || "PIMPINAN JAMAAH CIRENGIT", pageWidth / 2, 23, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(config.alamat || "Cirengit, Ds. Cangkuang, Kec. Cangkuang, Kab. Bandung", pageWidth / 2, 29, { align: "center" });

  // Garis Pemisah Ganda
  doc.setLineWidth(0.5);
  doc.line(15, 36, pageWidth - 15, 36);
  doc.setLineWidth(0.2);
  doc.line(15, 37, pageWidth - 15, 37);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), pageWidth / 2, 45, { align: "center" });

  let startY = 50;
  if (subtitle) {
    const subtitleLines = subtitle.split('\n');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitleLines, pageWidth / 2, 50, { align: "center" });
    startY = 50 + (subtitleLines.length * 5);
  }

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Normalize to tables array
  const allTables = tables || [];
  if (columns && rows && allTables.length === 0) {
    allTables.push({ columns, rows, summaryRows });
  }

  let currentY = startY;

  allTables.forEach((table, index) => {
    if (table.subtitle) {
      if (index > 0) currentY += 10; // add gap before next subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(table.subtitle, 15, currentY);
      currentY += 5;
    }

    // AutoTable Options
    const tableOptions: UserOptions = {
      startY: currentY,
      head: [table.columns],
      body: table.rows,
      theme: "striped",
      headStyles: {
        fillColor: [247, 164, 64], // #F7A440 - Amber/Orange Theme
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { top: 15, right: 15, bottom: 20, left: 15 },
    };

    autoTable(doc, tableOptions);

    currentY = (doc as any).lastAutoTable.finalY;

    if (table.summaryRows && table.summaryRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        body: table.summaryRows,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 9,
          fontStyle: "bold",
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 100 },
        },
        margin: { top: 15, right: 15, bottom: 20, left: 15 },
      });
      currentY = (doc as any).lastAutoTable.finalY;
    }
  });

  // Footer with Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  
  const printDate = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Dicetak pada: ${printDate} WIB`, 15, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  // Save the PDF
  doc.save(filename);
};

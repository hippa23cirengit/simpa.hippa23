const XLSX = require('xlsx');

try {
  const filePath = 'd:\\DATA NAJMI\\PJ. Pemuda Persis Cirengit\\HIPPA\\simpa\\data-penting\\Template Aplikasi KAS.xlsx';
  const workbook = XLSX.readFile(filePath);
  
  const result = {};
  workbook.SheetNames.forEach(sheetName => {
    // Read only first 20 rows of each sheet to understand structure
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    result[sheetName] = data.slice(0, 20);
  });
  
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Error:", error);
}

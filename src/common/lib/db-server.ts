import fs from "fs"
import path from "path"

const DB_FILE = path.join(process.cwd(), "src/common/lib/db.json")

export function readServerDb(): any {
  if (!fs.existsSync(DB_FILE)) {
    return {}
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8")
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

export function writeServerDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (e) {
    console.error("Gagal menulis ke server DB:", e)
  }
}

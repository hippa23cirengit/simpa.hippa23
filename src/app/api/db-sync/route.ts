import { NextResponse } from "next/server"
import { readServerDb, writeServerDb } from "@/common/lib/db-server"

export async function GET() {
  try {
    const data = readServerDb()
    return NextResponse.json({ status: true, data })
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ status: false, reason: "Key is required" }, { status: 400 })
    }

    const currentDb = readServerDb()
    currentDb[key] = value
    writeServerDb(currentDb)

    return NextResponse.json({ status: true })
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 })
  }
}

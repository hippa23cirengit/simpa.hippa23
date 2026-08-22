"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { KasTransaksi } from "@prisma/client"

export const description = "Grafik Arus Kas"

const chartConfig = {
  saldo: {
    label: "Saldo Sisa",
    color: "#f59e0b", // Amber (mirip kartu Sisa Saldo)
  },
  pemasukan: {
    label: "Pemasukan",
    color: "#10b981", // Emerald (mirip kartu Pemasukan)
  },
  pengeluaran: {
    label: "Pengeluaran",
    color: "#f43f5e", // Rose (mirip kartu Pengeluaran)
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  transaksiList: KasTransaksi[]
  saldoAwal: number
}

export function ChartAreaInteractive({ transaksiList = [], saldoAwal = 0 }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("30d")

  const chartData = React.useMemo(() => {
    const data = []
    const today = new Date()
    
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7
    
    const startDate = new Date()
    startDate.setDate(today.getDate() - daysToSubtract + 1)
    startDate.setHours(0, 0, 0, 0)

    let currentSaldo = saldoAwal
    const sortedTx = [...transaksiList].sort((a, b) => a.tanggal.localeCompare(b.tanggal))

    // Hitung saldo sebelum rentang waktu grafik
    for (const t of sortedTx) {
      const tDate = new Date(t.tanggal)
      if (tDate < startDate) {
        if (t.tipe === "pemasukan") currentSaldo += t.jumlah
        else if (t.tipe === "pengeluaran") currentSaldo -= t.jumlah
      }
    }

    // Kelompokkan transaksi per hari untuk pencarian cepat
    const txByDate: Record<string, { p: number; k: number }> = {}
    for (const t of sortedTx) {
      if (!txByDate[t.tanggal]) txByDate[t.tanggal] = { p: 0, k: 0 }
      if (t.tipe === "pemasukan") txByDate[t.tanggal].p += t.jumlah
      else if (t.tipe === "pengeluaran") txByDate[t.tanggal].k += t.jumlah
    }

    // Buat data harian
    for (let i = 0; i < daysToSubtract; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      const dateStr = `${year}-${month}-${day}`
      
      const dayData = txByDate[dateStr] || { p: 0, k: 0 }
      const pemasukan = dayData.p
      const pengeluaran = dayData.k
      
      currentSaldo = currentSaldo + pemasukan - pengeluaran
      
      data.push({
        date: dateStr,
        pemasukan,
        pengeluaran,
        saldo: currentSaldo
      })
    }

    return data
  }, [transaksiList, saldoAwal, timeRange])
  // Helper untuk format rupiah sederhana
  const formatRp = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <Card className="pt-0 border-slate-200 shadow-sm">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-slate-800">Grafik Arus Kas</CardTitle>
          <CardDescription className="text-slate-500">
            Melihat tren pemasukan, pengeluaran, dan saldo sisa
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(val) => setTimeRange(val || "30d")}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto sm:flex text-sm font-semibold border-slate-200 focus:ring-amber-400 focus:border-amber-400 outline-none"
            aria-label="Pilih rentang waktu"
          >
            <SelectValue placeholder="30 Hari Terakhir" />
          </SelectTrigger>
          <SelectContent className="rounded-xl font-medium">
            <SelectItem value="90d" className="rounded-lg">
              3 Bulan Terakhir
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              30 Hari Terakhir
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              7 Hari Terakhir
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-6 sm:px-6 sm:pt-8">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 12 }}>
            <defs>
              <linearGradient id="fillPemasukan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pemasukan)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-pemasukan)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillPengeluaran" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pengeluaran)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-pengeluaran)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-saldo)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-saldo)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })
              }}
              stroke="#94a3b8"
              fontSize={12}
              fontWeight={600}
            />
            <ChartTooltip
              cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                  formatter={(value, name, item, index, payload) => (
                    <div className="flex justify-between items-center w-full min-w-[120px]">
                      <span className="font-medium text-slate-500 capitalize">{name}</span>
                      <span className="font-bold text-slate-800 ml-4">
                        {formatRp(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            
            {/* Saldo as Area (background trend) */}
            <Area
              dataKey="saldo"
              type="monotone"
              fill="url(#fillSaldo)"
              stroke="var(--color-saldo)"
              strokeWidth={3}
              activeDot={{ r: 6, fill: "var(--color-saldo)" }}
            />
            
            {/* Pengeluaran */}
            <Area
              dataKey="pengeluaran"
              type="monotone"
              fill="url(#fillPengeluaran)"
              stroke="var(--color-pengeluaran)"
              strokeWidth={3}
              activeDot={{ r: 6, fill: "var(--color-pengeluaran)" }}
            />
            
            {/* Pemasukan */}
            <Area
              dataKey="pemasukan"
              type="monotone"
              fill="url(#fillPemasukan)"
              stroke="var(--color-pemasukan)"
              strokeWidth={3}
              activeDot={{ r: 6, fill: "var(--color-pemasukan)" }}
            />
            
            <ChartLegend content={<ChartLegendContent />} className="mt-4" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

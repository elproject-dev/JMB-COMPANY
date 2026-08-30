"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Perbandingan Penjualan vs Pembelian"

const chartConfig = {
  transaksi: {
    label: "Transaksi",
  },
  penjualan: {
    label: "Penjualan",
    color: "var(--primary)",
  },
  pembelian: {
    label: "Pembelian",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<any[]>([])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    async function fetchData() {
      const clearedAtStr = localStorage.getItem("mutasi_cleared_at")
      // Assume clearedAt is now representing epoch time to match created_at
      const clearedAt = clearedAtStr ? parseInt(clearedAtStr, 10) : 0

      const { data: txData, error } = await supabase
        .from('transaksi')
        .select('tanggal, jenis, jumlah_total, created_at')
        .eq('is_deleted', false)

      if (error || !txData) return

      // Grup per tanggal
      const grouped: Record<string, { penjualan: number; pembelian: number }> = {}

      txData.forEach((t: any) => {
        const itemTime = new Date(t.created_at).getTime()
        if (itemTime <= clearedAt) return

        const tgl = t.tanggal
        if (!tgl) return
        if (!grouped[tgl]) grouped[tgl] = { penjualan: 0, pembelian: 0 }
        
        const nominal = Number(t.jumlah_total) || 0
        
        if (t.jenis === "penjualan") {
          grouped[tgl].penjualan += nominal
        } else if (t.jenis === "pembelian") {
          grouped[tgl].pembelian += nominal
        }
      })

      // Konversi ke array dan urutkan
      const result = Object.entries(grouped)
        .map(([date, vals]) => ({
          date,
          penjualan: vals.penjualan,
          pembelian: vals.pembelian,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      if (result.length === 0) {
        // Generate dummy data untuk 90 hari terakhir jika belum ada transaksi nyata
        const dummy = []
        const now = new Date()
        for (let i = 90; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(d.getDate() - i)
          dummy.push({
            date: d.toISOString().split("T")[0],
            penjualan: Math.floor(Math.random() * 50000000) + 10000000, // 10jt - 60jt
            pembelian: Math.floor(Math.random() * 40000000) + 5000000,  // 5jt - 45jt
          })
        }
        setChartData(dummy)
      } else {
        setChartData(result)
      }
    }

    fetchData()
  }, [])

  const filteredData = React.useMemo(() => {
    if (chartData.length === 0) return []

    const now = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [chartData, timeRange])

  const formatRupiah = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`
    return num.toString()
  }

  return (
    <Card className="@container/card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
      <CardHeader>
        <CardTitle>Penjualan vs Pembelian</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Perbandingan nilai transaksi 3 bulan terakhir
          </span>
          <span className="@[540px]/card:hidden">3 bulan terakhir</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "7d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="7d">7 Hari</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Hari</ToggleGroupItem>
            <ToggleGroupItem value="90d">3 Bulan</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Pilih rentang waktu"
            >
              <SelectValue placeholder="30 Hari" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                7 Hari
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 Hari
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                3 Bulan
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Belum ada data transaksi untuk ditampilkan.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillPenjualan" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-penjualan)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-penjualan)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillPembelian" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-pembelian)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-pembelian)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    }}
                    formatter={(value, name) => {
                      const isPenjualan = name === "penjualan"
                      const label = isPenjualan ? "Penjualan" : "Pembelian"
                      const dotColor = isPenjualan ? "#ef4444" : "#22c55e"
                      const num = typeof value === "number" ? value : 0
                      return (
                        <div className="flex justify-between w-full gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                              style={{ backgroundColor: dotColor }}
                            />
                            <span className="text-muted-foreground">{label}</span>
                          </div>
                          <span className="font-medium tabular-nums text-foreground">
                            Rp {num.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="penjualan"
                type="natural"
                fill="url(#fillPenjualan)"
                stroke="var(--color-penjualan)"
              />
              <Area
                dataKey="pembelian"
                type="natural"
                fill="url(#fillPembelian)"
                stroke="var(--color-pembelian)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import { TrendUpIcon } from "@phosphor-icons/react"
import { Pie, PieChart, Label } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  nominal: {
    label: "Total",
  },
  pemasukan: {
    label: "Pemasukan",
    color: "var(--chart-1)",
  },
  pengeluaran: {
    label: "Pengeluaran",
    color: "var(--chart-2)",
  },
  piutang: {
    label: "Piutang",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

import { supabase } from "@/lib/supabase"

export function ChartPieDonut() {
  const [chartData, setChartData] = useState([
    { kategori: "pemasukan", nominal: 0, fill: "var(--color-pemasukan)" },
    { kategori: "pengeluaran", nominal: 0, fill: "var(--color-pengeluaran)" },
    { kategori: "piutang", nominal: 0, fill: "var(--color-piutang)" },
  ])
  const [totalKas, setTotalKas] = useState(0)

  useEffect(() => {
    async function fetchData() {
      const clearedAtStr = localStorage.getItem("mutasi_cleared_at")
      const clearedAt = clearedAtStr ? parseInt(clearedAtStr, 10) : 0

      let totalPemasukan = 0
      let totalPengeluaran = 0
      let totalPiutang = 0

      // 1. Ambil dari kas
      const { data: kasData } = await supabase
        .from('kas')
        .select('jenis, jumlah, created_at')
        .eq('is_deleted', false)

      if (kasData) {
        kasData.forEach((k: any) => {
          const itemTime = new Date(k.created_at).getTime()
          if (itemTime <= clearedAt) return

          const nominal = Number(k.jumlah) || 0
          if (k.jenis === "pemasukan") {
            totalPemasukan += nominal
          } else if (k.jenis === "pengeluaran") {
            totalPengeluaran += nominal
          } else if (k.jenis === "piutang_masuk" || k.jenis === "piutang_keluar") {
            totalPiutang += nominal
          }
        })
      }

      // 2. Ambil dari transaksi
      const { data: txData } = await supabase
        .from('transaksi')
        .select('jenis, jumlah_total, created_at')
        .eq('is_deleted', false)

      if (txData) {
        txData.forEach((t: any) => {
          const itemTime = new Date(t.created_at).getTime()
          if (itemTime <= clearedAt) return

          const nominal = Number(t.jumlah_total) || 0
          if (t.jenis === "penjualan") {
            totalPemasukan += nominal
          } else if (t.jenis === "pembelian") {
            totalPengeluaran += nominal
          }
        })
      }

      setChartData([
        { kategori: "pemasukan", nominal: totalPemasukan, fill: "var(--color-pemasukan)" },
        { kategori: "pengeluaran", nominal: totalPengeluaran, fill: "var(--color-pengeluaran)" },
        { kategori: "piutang", nominal: totalPiutang, fill: "var(--color-piutang)" },
      ])
      setTotalKas(totalPemasukan + totalPengeluaran + totalPiutang)
    }

    fetchData()
  }, [])

  const formatUang = (num: number) => {
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}Jt`
    if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}Rb`
    return `Rp ${num.toLocaleString('id-ID')}`
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Distribusi Kas</CardTitle>
        <CardDescription>Akumulasi Pengeluaran</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const label = name === "pemasukan" ? "Pemasukan" : name === "pengeluaran" ? "Pengeluaran" : "Piutang"
                    const num = typeof value === "number" ? value : 0
                    return (
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">
                          Rp {num.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="nominal"
              nameKey="kategori"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {formatUang(totalKas)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Total Kas
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-6">
        <div className="leading-none text-muted-foreground text-center">
          Proporsi distribusi nilai kas pada sistem.
        </div>
      </CardFooter>
    </Card>
  )
}

"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
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

export const description = "Grafik Harga Emas Saat Ini"

const chartConfig = {
  harga: {
    label: "Harga Emas",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartEmas() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    async function fetchGoldData() {
      setLoading(true)
      try {
        const response = await fetch('/api/gold-price')
        const result = await response.json()
        if (result.status === 'success') {
          setChartData(result.data)
        }
      } catch (error) {
        console.error("Gagal mengambil data harga emas:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchGoldData()
  }, [])

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    
    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [chartData, timeRange])

  // Get min and max for YAxis domain to make chart look dynamic
  const minHarga = Math.min(...filteredData.map(d => d.harga)) - 10000
  const maxHarga = Math.max(...filteredData.map(d => d.harga)) + 10000

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Pergerakan Harga Emas</CardTitle>
          <CardDescription>
            Grafik fluktuasi harga emas Antam per Gram
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(value) => {
          if (value) setTimeRange(value)
        }}>
          <SelectTrigger
            className="w-[160px] sm:ml-auto"
            aria-label="Pilih rentang waktu"
          >
            <SelectValue placeholder="30 Hari Terakhir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">
              7 Hari
            </SelectItem>
            <SelectItem value="30d">
              30 Hari
            </SelectItem>
            <SelectItem value="90d">
              3 Bulan
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Memuat data harga emas...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Belum ada data harga untuk ditampilkan.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillHarga" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-harga)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-harga)"
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
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                hide={true}
                domain={[minHarga, maxHarga]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("id-ID", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    }}
                    indicator="line"
                    formatter={(value: any, name, props) => {
                       return <div className="flex w-full justify-between items-center gap-4">
                         <span className="text-muted-foreground">Harga per Gram</span>
                         <span className="font-bold">Rp {parseInt(value).toLocaleString('id-ID')}</span>
                       </div>
                    }}
                  />
                }
              />
              <Area
                dataKey="harga"
                type="natural"
                fill="url(#fillHarga)"
                stroke="var(--color-harga)"
                strokeWidth={2}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
